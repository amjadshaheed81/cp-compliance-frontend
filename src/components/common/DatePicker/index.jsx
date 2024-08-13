import React, { useEffect, useRef } from "react";
import "./datepicker.css";
import { connect } from "react-redux";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const TdkDatePicker = ({ value, onChange,required,label,width="380px" }) => {

    const datePickerRef = useRef(null);

  return (
    <div style={{  display: "inline-block"}}>
      {label && <label htmlFor="datePicker" >
        {label}
      </label>}
      <input
       required={required}
        type="text"
        id="datePicker"
        value={value ? new Date(value)?.toLocaleDateString("en-GB") : "dd/mm/yyyy"}
        placeholder="dd/mm/yyyy"
        className="form-control"
        style={{
          width: width,
        }}
        onClick={() => datePickerRef.current.setOpen(true)} 
        readOnly
      />
      {/* <CalendarTodayIcon
        style={{
          //position: "absolute",
          float: 'left',
          right: "10px",
          top: label ? "50%" : "30%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "#aaa",
        }}
        onClick={() => datePickerRef.current.setOpen(true)} 
      /> */}
      <DatePicker
      style={{zIndex: 999}}
      required={required}
        onChange={(date) => onChange(date)}
        ref={datePickerRef}
        dateFormat="dd/MM/yyyy"
        customInput={<div />}
        popperClassName="custom-datepicker-popper" // Apply custom class
        popperPlacement="bottom-end"
      />
    </div>
  );
};
const mapStateToProps = (state) => ({
});
export default connect(mapStateToProps, {})(TdkDatePicker);
