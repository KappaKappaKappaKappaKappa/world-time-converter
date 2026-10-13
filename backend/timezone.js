const { fromZonedTime, formatInTimeZone } = require('date-fns-tz');
const { ru } = require('date-fns/locale');

function localToUtc(local, tz) {
  const date = fromZonedTime(local, tz);
  if (isNaN(date)) throw new Error('Неверный формат времени, нужен YYYY-MM-DDTHH:mm');
  return date.getTime();
}

function format(ts, tz) {
  return {
    text: formatInTimeZone(ts, tz, 'EEE, d MMMM HH:mm', { locale: ru }),
    offset: 'UTC' + formatInTimeZone(ts, tz, 'xxx'),
  };
}

function isValidTz(tz) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

module.exports = { localToUtc, format, isValidTz };