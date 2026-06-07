import { getLevelName } from "../constants/levels.js";

export default function LevelBadge({ levelId }) {
  return <span className="level-badge">{getLevelName(levelId)}</span>;
}
