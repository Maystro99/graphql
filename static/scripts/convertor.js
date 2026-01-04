export const readCssNumber = (name, fallback) => {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const formatShortDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

export const doneConvertor = (value) => {
  const roundCustom = (num) => {
    const scaled = num * 1000;
    const thirdDecimal = Math.floor(scaled) % 10;

    if (thirdDecimal >= 7) {
      return (Math.ceil(num * 100) / 100).toFixed(2);
    } else {
      return (Math.floor(num * 100) / 100).toFixed(2);
    }
  };

  if (value >= 1_000_000) {
    const mb = value / 1_000_000;
    return `${roundCustom(mb)} MB`;
  }

  const kb = value / 1_000;
  return `${roundCustom(kb)} KB`;
};

export const reciveConvertor = (value) => {
  if (value >= 1000000) {
    return (
      String((Math.round((value / 1_000_000) * 100) / 100).toFixed(2)) + " MB"
    );
  }
  console.log("val:", Math.round(value / 1000));

  return String(Math.round(value / 1_000).toFixed(0)) + " KB";
};

export const convertBytes = (bytes) => {
  if (bytes >= 1_000_000) {
    const mb = bytes / 1_000_000;

    const thirdDecimal = Math.floor(mb * 1000) % 10;

    let result;
    if (thirdDecimal >= 7) {
      result = Math.ceil(mb * 100) / 100;
    } else {
      result = Math.floor(mb * 100) / 100;
    }

    return `${result.toFixed(2)} MB`;
  }

  const kb = bytes / 1000;
  const roundedKB = Math.round(kb);
  return `${roundedKB} KB`;
};
