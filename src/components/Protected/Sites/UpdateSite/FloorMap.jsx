import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import { DndProvider, useDrop, useDrag } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { setLoader, uploadFloorPlan } from "../../../../store/thunk/site";
import { connect } from "react-redux";
import { scrollToElement } from "../../../../utils/scrollToElement";
import { toast } from "react-toastify";
import { del, get, put } from "../../../../api";
import { useSearchParams } from "react-router-dom";
import { isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";

const FloorMap = ({ siteLayout, setLoader, uploadFloorPlan, updateSite, loggedInUserData }) => {
    const [selectedTab, setSelectedTab] = useState(null);
    const [positionOption, setPositionOption] = useState([]);
    const [markerLabels, setMarkerLabels] = useState([]);
    const [droppedItems, setDroppedItems] = useState([]);
    const [floorPlanUrl, setFloorPlanUrl] = useState("");
    const [selectedFloor, setSelectedFloor] = useState({});
    const [selectedFloorId, setSelectedFloorId] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [imageContainer, setImageContainer] = useState({ width: 0, height: 0 });
    const imageRef = useRef(null);
    const embedRef = useRef(null);
    const [searchParams] = useSearchParams();
    const isViewMode = searchParams.get("isViewMode");

    useEffect(() => {
        const positions = siteLayout?.filter(
            (itm) => itm?.nodeType === "position" || itm?.nodeType === "type"
        );
        setPositionOption(positions || []);
        setFloorPlanUrl("");
    }, [siteLayout]);

    // Get image container dimensions when floor plan loads
    const handleImageLoad = () => {
        if (embedRef.current) {
            // Wait for embed to fully load and get its natural size
            setTimeout(() => {
                updateImageContainerSize();
            }, 500);
        }
    };

    const updateImageContainerSize = () => {
        if (embedRef.current) {
            const rect = embedRef.current.getBoundingClientRect();
            setImageContainer({
                width: rect.width,
                height: rect.height
            });
        }
    };

    // Update container size on zoom changes
    useEffect(() => {
        updateImageContainerSize();
    }, [zoomLevel]);

    // Listen for window resize to update container size
    useEffect(() => {
        const handleResize = () => {
            setTimeout(updateImageContainerSize, 100);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 3));
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));

    const getParentNodeName = (id) => positionOption?.find((itm) => itm?.id === id)?.nodeName;

    const handleFloorSelect = (id) => {
        const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
        const selectedFloorData = list?.find((i) => i.id === id);

        if (selectedFloorData) {
            const filteredRooms = siteLayout?.filter((room) => room?.parentNode === selectedFloorData?.id);
            setSelectedFloor(selectedFloorData);
            setSelectedFloorId(id);
            setMarkerLabels(filteredRooms);
            scrollToElement(".floorMapTitle");
            setSelectedTab({ id: selectedFloorData?.id, name: selectedFloorData?.nodeName });

            // Ensure the floor plan URL is set correctly
            if (selectedFloorData?.floorPlanUrl && selectedFloorData.floorPlanUrl !== "") {
                setFloorPlanUrl(selectedFloorData?.floorPlanUrl);
                getSavedMarger(selectedFloorData);
            } else {
                setFloorPlanUrl("");
                setDroppedItems([]);
                toast.warn("No floor plan available for this floor.");
            }
        }
    };

    const getFloorList = () => {
        const orderMap = {
            Basement: 1,
            "Ground Floor": 2,
            "1st Floor": 3,
            "2nd Floor": 4,
            "3rd Floor": 5,
            "4th Floor": 6,
            "5th Floor": 7,
            "6th Floor": 8,
            "7th Floor": 9,
            "8th Floor": 10,
            "9th Floor": 11,
            "10th Floor": 12,
            Vertical: 13,
        };
        return siteLayout
            ?.filter(
                (itm) =>
                    itm?.nodeType === "floor" &&
                    itm?.floorPlanUrl !== "" &&
                    itm?.floorPlanUrl !== undefined &&
                    itm?.floorPlanUrl !== null
            )
            .sort((a, b) => (orderMap[a.nodeName] || 999) - (orderMap[b.nodeName] || 999))
            .map((floor) => (
                <li
                    key={floor.id}
                    onClick={() => handleFloorSelect(floor.id)}
                    style={{
                        cursor: "pointer",
                        padding: "10px",
                        borderBottom: "1px solid grey",
                        backgroundColor: selectedFloorId === floor.id ? "#3b80f2" : "transparent",
                        color: selectedFloorId === floor.id ? "white" : "inherit",
                        transition: "background-color 0.3s ease"
                    }}
                >
                    <div>{`${getParentNodeName(floor?.parentNode)}: ${floor?.nodeName}`}</div>
                </li>
            ));
    };

    const updateMarkerPosition = (index, newLeft, newTop) => {
        if (embedRef.current) {
            // Get the base image dimensions (at zoom level 1)
            const baseRect = embedRef.current.getBoundingClientRect();
            const baseWidth = baseRect.width / zoomLevel;
            const baseHeight = baseRect.height / zoomLevel;

            // Calculate position as percentage of base image size
            const leftPercent = (newLeft / zoomLevel / baseWidth) * 100;
            const topPercent = (newTop / zoomLevel / baseHeight) * 100;

            setDroppedItems((prev) =>
                prev.map((item, i) => (i === index ? {
                    ...item,
                    leftPercent,
                    topPercent,
                    // Keep pixel values for backward compatibility
                    left: newLeft / zoomLevel,
                    top: newTop / zoomLevel
                } : item))
            );
        }
    };

    const saveImage = async () => {
        const payload = droppedItems?.map((itm) => ({
            id: itm?.id || null,
            label: itm?.label,
            roomId: itm?.roomId,
            siteId: updateSite?.siteId,
            leftPosition: itm?.leftPercent || itm?.left,
            topPosition: itm?.topPercent || itm?.top,
        }));
        for (const element of payload) {
            await put("/api/site/SaveMarker", element);
        }
        toast.success("Floor Marker updated Successully.");
        getSavedMarger(selectedFloor);
    };

    const getSavedMarger = async (selectedFloorData) => {
        const res = await get(`/api/site/SaveMarker/${updateSite?.siteId}`);
        const filteredData = res
            ?.map((itm) => {
                const leftValue = Number(itm?.leftPosition);
                const topValue = Number(itm?.topPosition);

                // Check if values are percentages (0-100) or pixels (>100)
                const isPercentage = leftValue <= 100 && topValue <= 100;

                return {
                    id: itm?.id || null,
                    label: itm?.label,
                    roomId: itm?.roomId,
                    siteId: updateSite?.siteId,
                    leftPercent: isPercentage ? leftValue : null,
                    topPercent: isPercentage ? topValue : null,
                    left: isPercentage ? null : leftValue,
                    top: isPercentage ? null : topValue,
                };
            })
            ?.filter((itm) => itm?.roomId === selectedFloorData?.id);
        setDroppedItems(filteredData || []);
    };

    const [{ isOver }, drop] = useDrop({
        accept: "LABEL",
        drop: (item, monitor) => {
            const clientOffset = monitor.getClientOffset();
            const scaledContainer = imageRef.current.querySelector('div');
            const containerRect = scaledContainer.getBoundingClientRect();

            const relativeX = clientOffset.x - containerRect.left;
            const relativeY = clientOffset.y - containerRect.top;

            // Get base image dimensions (at zoom level 1)
            const baseWidth = containerRect.width / zoomLevel;
            const baseHeight = containerRect.height / zoomLevel;

            // Calculate position as percentage of base image
            const leftPercent = (relativeX / zoomLevel / baseWidth) * 100;
            const topPercent = (relativeY / zoomLevel / baseHeight) * 100;

            if (leftPercent >= 0 && topPercent >= 0 && leftPercent <= 100 && topPercent <= 100) {
                setDroppedItems((prev) => [
                    ...prev,
                    {
                        leftPercent,
                        topPercent,
                        // Keep pixel values for backward compatibility
                        left: relativeX / zoomLevel,
                        top: relativeY / zoomLevel,
                        label: item.label,
                        roomId: item.roomId,
                    },
                ]);
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    });

    const DraggableLabel = ({ label, roomId, isDisabled }) => {
        const [{ isDragging }, drag] = useDrag({
            type: "LABEL",
            item: { label, roomId },
            collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
            canDrag: !isDisabled,
        });

        return (
            <li
                ref={drag}
                style={{
                    display: "inline-block",
                    opacity: isDragging ? 0.5 : 1,
                    padding: "6px 10px",
                    cursor: isDisabled ? "not-allowed" : "move",
                    height: "28px",
                    fontSize: "8px",
                    border: "1px solid grey",
                    marginBottom: "4px",
                    marginRight: "4px",
                    borderRadius: "50%",
                    backgroundColor: isDisabled ? "#f0f0f0" : "white",
                }}
            >
                {label}
            </li>
        );
    };

    const Marker = ({ index, item, updatePosition, removeMarker }) => {
        const [{ isDragging }, drag] = useDrag({
            type: "MARKER",
            item: { index },
            collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
            end: (_, monitor) => {
                const offset = monitor.getClientOffset();
                const scaledContainer = imageRef.current.querySelector('div');
                const containerRect = scaledContainer.getBoundingClientRect();

                if (offset) {
                    const relativeX = offset.x - containerRect.left;
                    const relativeY = offset.y - containerRect.top;
                    updatePosition(index, relativeX, relativeY);
                }
            },
        });

        // Calculate position based on percentage relative to current image size
        const getMarkerPosition = () => {
            if (item.leftPercent !== null && item.leftPercent !== undefined && embedRef.current) {
                const rect = embedRef.current.getBoundingClientRect();
                return {
                    left: (item.leftPercent / 100) * rect.width,
                    top: (item.topPercent / 100) * rect.height
                };
            }
            // Fallback to pixel values scaled by zoom
            return {
                left: (item.left || 0) * zoomLevel,
                top: (item.top || 0) * zoomLevel
            };
        };

        const position = getMarkerPosition();

        return (
            <Tooltip title={`View Assets: ${item.label}`} arrow>
                <div
                    ref={drag}
                    style={{
                        position: "absolute",
                        left: position.left,
                        top: position.top,
                        transform: isDragging ? "scale(1.05)" : "scale(1)",
                        transition: "transform 0.1s ease-out",
                        backgroundColor: "#d34053",
                        color: "white",
                        padding: "4px",
                        fontSize: "8px",
                        borderRadius: "50%",
                        cursor: "move",
                        opacity: isDragging ? 0.7 : 1,
                        zIndex: 1000,
                    }}
                >
          <span
              style={{
                  position: "absolute",
                  top: "-10px",
                  right: "-10px",
                  backgroundColor: "black",
                  color: "white",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  cursor: "pointer",
              }}
              onClick={() => removeMarker(index, item)}
          >
            ✖
          </span>
                    <a target="_blank" className="markerLink" href={`/#/assets?roomId=${item?.roomId}&roomLabel=${item?.label}`}>
                        {item.label}
                    </a>
                </div>
            </Tooltip>
        );
    };

    const removeMarker = async (index, item) => {
        try {
            if(item.id) {
                await del(`api/site/SaveMarker/${item.id}`);
                toast.success("Marker deleted successfully.");
            }

            setDroppedItems((prev) => prev.filter((_, i) => i !== index));
        } catch (error) {
            console.log('error',error);
            toast.error("Failed to delete marker.");
        }
    };

    return (
        <div>
            <h5 className="pt-5 text-start floorMapTitle">Floor Map</h5>
            <Box sx={{ flexGrow: 1, bgcolor: "background.paper", display: "flex", height: 600 }}>
                <ul style={{ borderRight: "1px solid grey", padding: 0, margin: 0, width: "200px", listStyle: "none" }}>{getFloorList()}</ul>
                <div ref={drop} style={{ position: "relative", width: "100%", padding: "0 20px" }}>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "100%",
                        marginBottom: "15px"
                    }}>

                        <div className="marker-labels-container" style={{ width: "100%" }}>
                            <ul style={{
                                paddingLeft: "0",
                                margin: "10px 0",
                                listStyle: "none",
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "center"
                            }}>
                                {markerLabels.map((room) => {
                                    const hasSpace = room?.nodeName?.includes(' ');
                                    const label = hasSpace ? room?.nodeName?.split(" ")[1] : room?.nodeName;
                                    const isDisabled = droppedItems.some((item) =>
                                        item.label === (hasSpace ? room?.nodeName?.split(" ")[1] : room?.nodeName)
                                    );
                                    return (
                                        <DraggableLabel
                                            key={room?.id}
                                            roomId={room?.parentNode}
                                            label={label}
                                            isDisabled={isDisabled || !isManagerAdminLogin(loggedInUserData)}
                                        />
                                    );
                                })}
                            </ul>
                        </div>

                        {selectedFloorId && (
                            <div className="save-markers-container" style={{ marginBottom: "10px" }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={saveImage}
                                    style={{ fontWeight: "normal", textTransform: "uppercase" }}
                                    disabled={!isManagerAdminLogin(loggedInUserData)}
                                >
                                    Save Markers
                                </Button>
                            </div>
                        )}

                        {floorPlanUrl && (
                            <div className="button-container" style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleZoomIn}
                                    style={{ fontWeight: "normal", textTransform: "uppercase" }}
                                >
                                    Zoom In
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleZoomOut}
                                    style={{ fontWeight: "normal", textTransform: "uppercase" }}
                                >
                                    Zoom Out
                                </Button>
                            </div>
                        )}
                    </div>

                    {floorPlanUrl ? (
                        <div
                            ref={imageRef}
                            style={{
                                position: "relative",
                                width: "100%",
                                height: "calc(100% - 150px)",
                                overflow: "auto",
                                border: "1px solid #eee",
                                borderRadius: "4px",
                                backgroundColor: "#f9f9fa"
                            }}
                        >
                            <div
                                style={{
                                    transform: `scale(${zoomLevel})`,
                                    transformOrigin: "top left",
                                    width: "fit-content",
                                    height: "fit-content",
                                    position: "relative",
                                }}
                            >
                                <embed
                                    ref={embedRef}
                                    src={floorPlanUrl}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        display: "block"
                                    }}
                                    onLoad={handleImageLoad}
                                />
                                {droppedItems.map((item, index) => (
                                    <Marker key={index} index={index} item={item} updatePosition={updateMarkerPosition} removeMarker={removeMarker} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 p-4 text-center bg-light" style={{ borderRadius: "4px" }}>
                            Floor plan file is not available.
                        </div>
                    )}
                </div>
            </Box>
        </div>
    );
};

const FloorMapWithDnd = (props) => (
    <DndProvider backend={HTML5Backend}>
        <FloorMap {...props} />
    </DndProvider>
);

const mapStateToProps = (state) => ({
    updateSite: state.site.updateSite,
    loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, { uploadFloorPlan, setLoader })(FloorMapWithDnd);
