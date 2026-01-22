export const AGENT_COLORS = [
  "#2979ff",
  "#00e676",
  "#ff9100",
  "#7c4dff",
  "#ff1744",
  "#00b8d4",
  "#f50057",
  "#ffea00",
  "#76ff03",
  "#18ffff"
];

export const getAgentColor = (index: number) =>
  AGENT_COLORS[index % AGENT_COLORS.length];
