import React, { useEffect, useRef, useState } from "react";
import "./datepicker.css";
import { connect } from "react-redux";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";

const TdkDatePicker = ({
  value,
  onChange,
  required,
  label,
  width = "380px",
  disabled,
  minDate,
}) => {
  const datePickerRef = useRef(null);
  // Store the actual Date object in state
  const [dateValue, setDateValue] = useState(value ? new Date(value) : null);
  // Store the display string separately
  const [displayValue, setDisplayValue] = useState(
    value ? moment(value).format("DD/MM/YYYY") : ""
  );
  const [isTyping, setIsTyping] = useState(false);

  // Update display value when dateValue changes
  useEffect(() => {
    if (dateValue) {
      setDisplayValue(moment(dateValue).format("DD/MM/YYYY"));
    } else {
      setDisplayValue("");
    }
  }, [dateValue]);

  // Format input with slashes automatically
  const formatDateWithSlashes = (input) => {
    const digits = input.replace(/\D/g, "");
    const day = digits?.slice(0, 2);
    const month = digits?.slice(2, 4);
    const year = digits?.slice(4, 8);

    let formattedDate = day;
    if (month) formattedDate += `/${month}`;
    if (year) formattedDate += `/${year}`;

    return formattedDate;
  };

  // Handle manual date input
  const handleInputChange = (e) => {
    let inputValue = e.target.value;
    inputValue = formatDateWithSlashes(inputValue);
    setDisplayValue(inputValue);
    setIsTyping(true);

    // Parse the input as a valid date
    const parsedDate = moment(inputValue, "DD/MM/YYYY", true);
    if (parsedDate.isValid()) {
      const jsDate = new Date(
        parsedDate.year(),
        parsedDate.month(),
        parsedDate.date(),
        10,
        0,
        0 // Force local date and time
      );
      setDateValue(jsDate);
      onChange(jsDate); // Pass Date object to parent
    } else if (inputValue === "") {
      setDateValue(null);
      onChange(null);
    }
  };

  const handleInputClick = () => {
    if (!isTyping) {
      datePickerRef.current.setOpen(true);
    }
  };

  return (
    <div>
      {label && <label htmlFor="datePicker">{label}</label>}
      <div style={{ display: "flex", alignItems: "center" }}>
        <input
          required={required}
          type="text"
          autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
          id="datePicker"
          value={displayValue}
          placeholder="dd/mm/yyyy"
          className="form-control"
          disabled={disabled ? true : false}
          style={{ width }}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onBlur={() => setIsTyping(false)}
        />
        <CalendarTodayIcon
          style={{ cursor: "pointer", color: "#aaa" }}
          onClick={() => datePickerRef.current.setOpen(true)}
        />
      </div>
      <DatePicker
        ref={datePickerRef}
        selected={dateValue}
        onChange={(date) => {
          setDateValue(date);
          onChange(date); // Pass Date object to parent
        }}
        dateFormat="dd/MM/yyyy"
        customInput={<div />}
        popperClassName="custom-datepicker-popper"
        popperPlacement="left-ends"
        minDate={minDate ? new Date(minDate) : null}
      />
    </div>
  );
};

export default connect(null, {})(TdkDatePicker);
