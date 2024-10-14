import React, { useEffect, useRef, useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDrag } from "react-dnd";
import TabPanel from "../../../common/TabPanel/TabPanel";
import { setLoader, uploadFloorPlan } from "../../../../store/thunk/site";
import { toast } from "react-toastify";
import { connect } from "react-redux";
import { saveAs } from "file-saver"; // For image download

const FloorMap = ({ siteLayout, setLoader, uploadFloorPlan, updateSite }) => {
  const [tabValue, setTabValue] = useState(null);
  const [selectedTab, setSelectedTab] = useState(null);
  const [positionOption, setPositionOption] = useState([]);
  const [droppedItems, setDroppedItems] = useState([]);
  const [floorPlanUrl, setFloorPlanUrl] = useState("");
  const imageRef = useRef(null);
  const canvasRef = useRef(null); // Reference for the canvas element

  useEffect(() => {
    const positions = siteLayout?.filter(
      (itm) => itm?.nodeType === "position" || itm?.nodeType === "type"
    );
    setPositionOption(positions || []);
  }, [siteLayout]);

  const getParentNodeName = (id) => {
    return positionOption?.filter((itm) => itm?.id === id)?.[0]?.nodeName;
  };

  const handleChange = (event, newValue) => {
    const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    const selectedFloor = list?.[newValue];
    console.log("selectedFloor", selectedFloor);
    setDroppedItems([]); // This clears all the dropped labels
    setSelectedTab({id:selectedFloor?.id, name: selectedFloor?.nodeName});
    setTabValue(newValue);
    setFloorPlanUrl(selectedFloor?.floorPlanUrl); // Store the current floor plan URL
  };

  const getTabLabel = () => {
    const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    const roomList = siteLayout?.filter((itm) => itm?.nodeType === "room");

    return list?.map((floor) => {
      const filteredRooms = roomList?.filter(
        (room) => room?.parentNode === floor?.id
      );

      return (
        <Tab
          label={
            <>
              <div>{`${getParentNodeName(floor?.parentNode)}: ${
                floor?.nodeName
              }`}</div>
              {filteredRooms.length > 0 && (
                <ul style={{ paddingLeft: "20px", marginTop: "10px" }}>
                  {filteredRooms.map((room) => (
                    <DraggableLabel key={room?.id} label={room?.nodeName} />
                  ))}
                </ul>
              )}
            </>
          }
        />
      );
    });
  };

  const getTabPanel = () => {
    const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    return list?.map((itm, newValue) => (
      <TabPanel value={tabValue} index={newValue}>
        {itm?.floorPlanUrl ? (
          <>
            <div
              ref={imageRef}
              style={{ position: "relative", width: "500px", height: "auto" }}
            >
              <embed src={floorPlanUrl} width="500px" height="auto" />
              {droppedItems.map((item, index) => (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    left: item.left,
                    top: item.top,
                    width: "100px",
                    height: "35px",
                    backgroundColor: "#d34053",
                    color: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "2%",
                    fontSize: "8px",
                    borderRadius: "4px",
                  }}
                >
                  {item.label}
                  <span
                    style={{ cursor: "pointer", fontSize: "8px" }}
                    onClick={() => handleDelete(index)}
                  >
                    X
                  </span>
                </div>
              ))}
            </div>
            {/* Canvas for saving the image */}
            <canvas
              ref={canvasRef}
              style={{ display: "none", width: "500px", height: "auto" }} // Hidden canvas
            />
          </>
        ) : (
          "Floor plan file is not available."
        )}
      </TabPanel>
    ));
  };

  const [{ isOver }, drop] = useDrop({
    accept: "LABEL",
    drop: (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const imageRect = imageRef.current.getBoundingClientRect();
      const newLeft = clientOffset.x - imageRect.left;
      const newTop = clientOffset.y - imageRect.top;

      if (
        newLeft >= 0 &&
        newTop >= 0 &&
        newLeft <= imageRect.width &&
        newTop <= imageRect.height
      ) {
        const newDroppedItem = {
          left: newLeft,
          top: newTop,
          label: item.label,
        };
        setDroppedItems((prev) => [...prev, newDroppedItem]);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const DraggableLabel = ({ label }) => {
    const [{ isDragging }, drag] = useDrag({
      type: "LABEL",
      item: { label },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    });

    return (
      <div
        ref={drag}
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: "move",
          width: "120px",
          height: "40px",
          fontSize: "10px",
          border: "1px solid grey",
          marginBottom: "10px",
        }}
      >
        {label}
      </div>
    );
  };

  const handleDelete = (indexToDelete) => {
    setDroppedItems((prevItems) =>
      prevItems.filter((_, index) => index !== indexToDelete)
    );
  };
  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas reference is null");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous"; // Allow cross-origin requests
    img.src = floorPlanUrl; // Use the stored floor plan URL

    img.onload = () => {
      // Resize the canvas to match the dimensions of the loaded image
      canvas.width = img.width;
      canvas.height = img.height;

      // Calculate scale factor between displayed image and original image
      const displayedImageWidth = imageRef.current.clientWidth;
      const displayedImageHeight = imageRef.current.clientHeight;

      const scaleX = img.width / displayedImageWidth;
      const scaleY = img.height / displayedImageHeight;

      // Clear the canvas and draw the image onto it
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Loop through dropped items and render them on top of the image
      droppedItems.forEach((item) => {
        // Adjust the position of the labels based on the scale factor
        const scaledLeft = item.left * scaleX;
        const scaledTop = item.top * scaleY;

        // Draw the background rectangle for the label
        ctx.fillStyle = "#d34053";
        ctx.fillRect(scaledLeft, scaledTop, 100 * scaleX, 35 * scaleY);

        // Draw the label text
        ctx.fillStyle = "white";
        ctx.font = `${8 * scaleX}px Arial`; // Scale font size
        ctx.fillText(
          item.label,
          scaledLeft + 5 * scaleX,
          scaledTop + 25 * scaleY
        );
      });

      // Convert the canvas to a Blob and trigger the download/upload
      canvas.toBlob((blob) => {
        if (blob) {
          // Prepare the form data for upload
          let form_data = new FormData();
          // Append the Blob as a file in FormData
          form_data.append("files", blob, `${selectedTab?.name}.png`,);

          // Add additional metadata about the floor plan
          const data = [
            {
              nodeId: selectedTab?.id,
              fileName: `${selectedTab?.name}.png`,
            },
          ];
          form_data.append("floorPlans", JSON.stringify(data));

          // Make the API call to upload the form data
          setLoader(true);
          uploadFloorPlan(form_data, updateSite?.siteId)
            .then((response) => {
              setDroppedItems([]); // This clears all the dropped labels
              console.log("File uploaded successfully", response);
              setLoader(false);
            })
            .catch((error) => {
              console.error("Error uploading file", error);
              setLoader(false);
            });
        } else {
          console.error("Failed to create image blob");
        }
      }, "image/png");
    };

    img.onerror = (error) => {
      console.error("Failed to load image:", error);
    };
  };

  return (
    <div>
      <h5 className="pt-5 text-start">Floor Map</h5>
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "background.paper",
          display: "flex",
          height: 400,
        }}
      >
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={tabValue}
          onChange={handleChange}
          aria-label="Vertical tabs example"
          sx={{ borderRight: 1, borderColor: "divider" }}
        >
          {getTabLabel()}
        </Tabs>
        <div ref={drop} style={{ position: "relative", width: "100%" }}>
          {getTabPanel()}
        </div>
      </Box>
      <Button
        style={{ marginTop: "5%", marginBottom: "5%" }}
        variant="contained"
        color="primary"
        onClick={saveImage}
      >
        Save Image
      </Button>
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
});
export default connect(mapStateToProps, { uploadFloorPlan, setLoader })(
  FloorMapWithDnd
);
