import WorkHours from "./WorkHours";

// A list of work hours and location for each weekday

export default interface WeeklySchedule {
  [day: string]: {
    workhours: WorkHours;
    location: string;
  };
}
