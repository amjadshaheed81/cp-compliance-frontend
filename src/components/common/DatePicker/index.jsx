import React, { useEffect, useRef } from "react";
import { connect } from "react-redux";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const TdkDatePicker = ({ value, onChange,required,width="380px" }) => {

    const datePickerRef = useRef(null);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <label htmlFor="datePicker" >
        Due Date
      </label>
      <input
       required={required}
        type="text"
        id="datePicker"
        value={value ? value?.toLocaleDateString("en-GB") : "dd/mm/yyyy"}
        placeholder="dd/mm/yyyy"
        className="form-control"
        style={{
          width: width,
        }}
        onClick={() => datePickerRef.current.setOpen(true)} 
        readOnly
      />
      <CalendarTodayIcon
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "#aaa",
        }}
        onClick={() => datePickerRef.current.setOpen(true)} 
      />
      <DatePicker
      required={required}
        onChange={(date) => onChange(date)}
        ref={datePickerRef}
        dateFormat="dd/MM/yyyy"
        customInput={<div />} 
        popperPlacement="bottom-end"
      />
    </div>
  );
};
const mapStateToProps = (state) => ({
});
export default connect(mapStateToProps, {})(TdkDatePicker);
