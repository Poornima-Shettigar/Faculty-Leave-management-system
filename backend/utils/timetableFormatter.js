exports.formatToTable = (entries) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const table = {};

  days.forEach(day => {
    table[day] = {};

    for (let p = 1; p <= 8; p++) {
      table[day][p] = null; // default empty cell
    }
  });

  entries.forEach(item => {
    table[item.day][item.period] = item;
  });

  return table;
};
