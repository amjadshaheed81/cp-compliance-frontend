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

const FloorMap = ({
  siteLayout,
  setLoader,
  uploadFloorPlan,
  updateSite,
  loggedInUserData,
}) => {
  const [selectedTab, setSelectedTab] = useState(null);
  const [positionOption, setPositionOption] = useState([]);
  const [markerLabels, setMarkerLabels] = useState([]);
  const [droppedItems, setDroppedItems] = useState([]);
  const [floorPlanUrl, setFloorPlanUrl] = useState("");
  const [selectedFloor, setSelectedFloor] = useState({});
  const imageRef = useRef(null);
  const [searchParams] = useSearchParams();
  const isViewMode = searchParams.get("isViewMode");
  const [naturalDimensions, setNaturalDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setDroppedItems([...droppedItems]);
    });

    if (imageRef.current) {
      resizeObserver.observe(imageRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [droppedItems]);

  useEffect(() => {
    const positions = siteLayout?.filter(
      (itm) => itm?.nodeType === "position" || itm?.nodeType === "type"
    );
    setPositionOption(positions || []);
    setFloorPlanUrl("");
  }, [siteLayout]);

  const getParentNodeName = (id) => {
    return positionOption?.find((itm) => itm?.id === id)?.nodeName;
  };

  const handleFloorSelect = (index) => {
    const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    const selectedFloorData = list?.find((i) => i.id === index);
    const filteredRooms = siteLayout?.filter(
      (room) => room?.parentNode === selectedFloorData?.id
    );
    setSelectedFloor(selectedFloorData);
    setMarkerLabels(filteredRooms);
    scrollToElement(".floorMapTitle");
    // setDroppedItems([]); // Clear previously dropped items when changing floors
    setSelectedTab({
      id: selectedFloorData?.id,
      name: selectedFloorData?.nodeName,
    });
    setFloorPlanUrl(selectedFloorData?.floorPlanUrl);
    getSavedMarger(selectedFloorData);
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
      Vertical: 10,
    };
    const list = siteLayout
      ?.filter(
        (itm) =>
          itm?.nodeType === "floor" &&
          itm?.floorPlanUrl !== "" &&
          itm?.floorPlanUrl !== undefined &&
          itm?.floorPlanUrl !== null
      )
      .sort((a, b) => {
        const aOrder = orderMap[a.nodeName] || Number.MAX_SAFE_INTEGER; // Default to a high value for "rest"
        const bOrder = orderMap[b.nodeName] || Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
      });

    return list?.map((floor, index) => (
      <li
        key={floor?.id} // Use unique id instead of index for key
        onClick={() => {
          handleFloorSelect(floor?.id);
        }}
        style={{
          cursor: "pointer",
          padding: "10px",
          borderBottom: "1px solid grey",
        }}
      >
        <div>{`${getParentNodeName(floor?.parentNode)}: ${
          floor?.nodeName
        }`}</div>
      </li>
    ));
  };

  const updateMarkerPosition = (index, newLeft, newTop) => {
    if (imageRef.current && naturalDimensions.width) {
      const imageRect = imageRef.current.getBoundingClientRect();
      const scaleX = naturalDimensions.width / imageRect.width;
      const scaleY = naturalDimensions.height / imageRect.height;

      const naturalX = newLeft * scaleX;
      const naturalY = newTop * scaleY;

      setDroppedItems((prevItems) =>
        prevItems.map((item, i) =>
          i === index ? { ...item, naturalX, naturalY } : item
        )
      );
    }
  };

  const saveImage = async () => {
    const payload = droppedItems?.map((itm) => ({
      id: itm?.id || null,
      label: itm?.label,
      roomId: itm?.roomId,
      siteId: updateSite?.siteId,
      leftPosition: itm.naturalX,
      topPosition: itm.naturalY,
    }));
    
    for (const element of payload) {
      const res = await put("/api/site/SaveMarker", element);
    }
    toast.success("Floor Marker updated Successfully.");
    getSavedMarger(selectedFloor);
  };

  const getSavedMarger = async (selectedFloorData) => {
    const res = await get(`/api/site/SaveMarker/${updateSite?.siteId}`);
    const filteredData = res
      ?.map((itm) => ({
        id: itm?.id,
        label: itm?.label,
        roomId: itm?.roomId,
        naturalX: Number(itm.leftPosition),
        naturalY: Number(itm.topPosition),
      }))
      ?.filter((itm) => itm?.roomId === selectedFloorData?.id);
    setDroppedItems(filteredData || []);
  };

  const [{ isOver }, drop] = useDrop({
    accept: "LABEL",
    drop: (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !imageRef.current) return;

      const imageRect = imageRef.current.getBoundingClientRect();
      const scaleX = naturalDimensions.width / imageRect.width;
      const scaleY = naturalDimensions.height / imageRect.height;

      const naturalX = (clientOffset.x - imageRect.left) * scaleX;
      const naturalY = (clientOffset.y - imageRect.top) * scaleY;

      setDroppedItems((prev) => [
        ...prev,
        {
          naturalX,
          naturalY,
          label: item.label,
          roomId: item.roomId,
        },
      ]);
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
      canDrag: !isDisabled, // Prevent dragging if label is disabled
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
          listStyleType: "none",
          whiteSpace: "nowrap",
          backgroundColor: isDisabled ? "#f0f0f0" : "white", // Grayed out background for disabled labels
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
        if (!offset || !imageRef.current) return;

        const imageRect = imageRef.current.getBoundingClientRect();
        const scaleX = naturalDimensions.width / imageRect.width;
        const scaleY = naturalDimensions.height / imageRect.height;

        const newLeft = (offset.x - imageRect.left) * scaleX;
        const newTop = (offset.y - imageRect.top) * scaleY;

        updatePosition(index, newLeft / scaleX, newTop / scaleY);
      },
    });

    // Convert natural coordinates to current display coordinates
    const imageRect = imageRef.current?.getBoundingClientRect() || {
      width: 0,
      height: 0,
    };
    const scaleX = naturalDimensions.width / imageRect.width;
    const scaleY = naturalDimensions.height / imageRect.height;
    const left = item.naturalX / scaleX;
    const top = item.naturalY / scaleY;

    return (
      <Tooltip title={`View Assets: ${item.label}`} arrow>
        <div
          ref={drag}
          style={{
            position: "absolute",
            left: left,
            top: top,
            transform: isDragging ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.1s ease-out",
            willChange: "transform",
            backgroundColor: "#d34053",
            color: "white",
            padding: "4px",
            fontSize: "8px",
            borderRadius: "50%",
            cursor: "move",
            opacity: isDragging ? 0.7 : 1,
          }}
        >
          {/* Your marker UI remains same */}
        </div>
      </Tooltip>
    );
  };
  const removeMarker = async (index, item) => {
    try {
      const url = `api/site/SaveMarker/${item.id}`;
      await del(url);
      toast.success("Marker deleted successfully.");
      setDroppedItems((prevItems) => prevItems.filter((_, i) => i !== index));
    } catch (error) {
      toast.error("Failed to delete marker.");
    }
  };

  return (
    <div>
      <h5 className="pt-5 text-start floorMapTitle">Floor Map</h5>
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "background.paper",
          display: "flex",
          height: 600,
        }}
      >
        <ul
          style={{
            borderRight: "1px solid grey",
            padding: "0",
            margin: "0",
            width: "200px",
            listStyleType: "none",
          }}
        >
          {getFloorList()}
        </ul>
        <div ref={drop} style={{ position: "relative", width: "100%" }}>
          <ul style={{ paddingLeft: "20px", marginTop: "10px" }}>
            {markerLabels.map((room) => {
              const isDisabled = droppedItems.some(
                (item) => item.label === room?.nodeName.split(" ")[1]
              );
              return (
                <DraggableLabel
                  key={room?.id}
                  roomId={room?.parentNode}
                  label={room?.nodeName?.split(" ")[1]}
                  isDisabled={isDisabled}
                />
              );
            })}
          </ul>
          <div>
            {isViewMode === "edit" && (
              <Button
                variant="contained"
                color="primary"
                onClick={saveImage}
                disabled={!isManagerAdminLogin(loggedInUserData)}
              >
                Save Markers
              </Button>
            )}
          </div>
          {floorPlanUrl ? (
    <div
      ref={drop}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <img
        ref={imageRef}
        src={floorPlanUrl}
        onLoad={(e) => {
          setNaturalDimensions({
            width: e.target.naturalWidth,
            height: e.target.naturalHeight,
          });
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
        alt="Floor plan"
      />
      {droppedItems.map((item, index) => (
        <Marker
          key={index}
          index={index}
          item={item}
          updatePosition={updateMarkerPosition}
          removeMarker={removeMarker}
        />
      ))}
    </div>
  ) : (
    "Floor plan file is not available."
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

export default connect(mapStateToProps, { uploadFloorPlan, setLoader })(
  FloorMapWithDnd
);
