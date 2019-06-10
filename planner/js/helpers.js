module.exports = {
  addDays: (_day, days) => {
    const day = _day;
    return new Date(day.getFullYear(), day.getMonth(), day.getDate() + days);
  },
  weekDay: (day) => {
    return (day.getDay() || 7) - 1;
  },
  monthString: (day) => {
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][day.getMonth()];
  },
  getLastMonday: () => {
    const now = new Date();
    const mon = new Date();
    mon.setDate(now.getDate() - now.getDay() + 1);
    return mon;
  }
};
