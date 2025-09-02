import React, { useEffect, useRef, useState } from "react";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './DatePicker.css';
import moment from "moment";

const TdkDatePicker = ({
  value,
  onChange,
  required,
  label,
  width = "220px",
  disabled,
  minDate,
}) => {
  const datePickerRef = useRef(null);
  const [dateValue, setDateValue] = useState(value ? new Date(value) : null);
  const [displayValue, setDisplayValue] = useState(
    value ? moment(value).format("DD/MM/YYYY") : ""
  );
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (dateValue) {
      setDisplayValue(moment(dateValue).format("DD/MM/YYYY"));
    } else {
      setDisplayValue("");
    }
  }, [dateValue]);

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

  const handleInputChange = (e) => {
    let inputValue = e.target.value;
    inputValue = formatDateWithSlashes(inputValue);
    setDisplayValue(inputValue);
    setIsTyping(true);

    const parsedDate = moment(inputValue, "DD/MM/YYYY", true);
    if (parsedDate.isValid()) {
      const jsDate = new Date(
        parsedDate.year(),
        parsedDate.month(),
        parsedDate.date(),
        10,
        0,
        0
      );
      setDateValue(jsDate);
      onChange(jsDate);
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
    <div className="tdk-datepicker-container">
      {label && <label className="tdk-datepicker-label">{label}</label>}
      <div className="tdk-datepicker-input-container">
        <input
          required={required}
          type="text"
          autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
          className="tdk-datepicker-input"
          value={displayValue}
          placeholder="dd/mm/yyyy"
          disabled={disabled}
          style={{ width }}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onBlur={() => setIsTyping(false)}
        />
        <CalendarTodayIcon
          className="tdk-datepicker-icon"
          onClick={() => datePickerRef.current.setOpen(true)}
        />
      </div>
      <DatePicker
        ref={datePickerRef}
        selected={dateValue}
        onChange={(date) => {
          setDateValue(date);
          onChange(date);
        }}
        dateFormat="dd/MM/yyyy"
        customInput={<div />}
        popperClassName="custom-datepicker-popper"
        popperPlacement="bottom-start"
        minDate={minDate ? new Date(minDate) : null}
        fixedHeight
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
      />
    </div>
  );
};

export default TdkDatePicker;