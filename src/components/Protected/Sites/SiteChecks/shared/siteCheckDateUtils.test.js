import {
  getSiteCheckDateByStatus,
  getUkLocalDate,
  getUkLocalDateAsDate,
  getUkLocalDateTimeInput,
  isCurrentUkInspectionDate,
} from "./siteCheckDateUtils";

describe("siteCheckDateUtils", () => {
  test("returns the UK date when UTC has crossed into the next UK day", () => {
    const lateSummerUtcDate = new Date("2026-08-06T23:30:00.000Z");

    expect(getUkLocalDate(lateSummerUtcDate)).toBe("2026-08-07");
  });

  test("Open Site Check uses the current UK date", () => {
    expect(getSiteCheckDateByStatus("Open", "2020-01-01")).toBe(
      getUkLocalDate()
    );
  });

  test("Done Site Check keeps the saved date", () => {
    expect(getSiteCheckDateByStatus("Done", "2026-07-15")).toBe(
      "2026-07-15"
    );
  });

  test("returns a Date object for DatePicker using the UK calendar date", () => {
    const value = getUkLocalDateAsDate(
      new Date("2026-08-06T23:30:00.000Z")
    );

    expect(value.getFullYear()).toBe(2026);
    expect(value.getMonth()).toBe(7);
    expect(value.getDate()).toBe(7);
  });

  test("returns UK local date/time for datetime-local inputs", () => {
    expect(
      getUkLocalDateTimeInput(new Date("2026-08-06T23:30:00.000Z"))
    ).toBe("2026-08-07T00:30");
  });

  test("recognises an inspection saved on the current UK date", () => {
    expect(
      isCurrentUkInspectionDate(`${getUkLocalDate()}T00:00:00`)
    ).toBe(true);
  });
});
