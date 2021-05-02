export const getEmotion = (label) => {
    let value=label.indexOf(Math.max.apply(null,label))
  switch (value) {
    case 0:
      return "Neutral";
    case 1:
      return "Felicidad";
    case 2:
      return "Tristeza";
    case 3:
      return "Molestia";
    case 4:
      return "Miedo";
    case 5:
      return "Disgusto";
    case 6:
      return "Sorpresa";
    default:
        return "Nada"
  }
};
