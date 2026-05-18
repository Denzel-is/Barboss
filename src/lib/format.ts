function rewardWord(amount: number) {
  const value = Math.abs(amount);
  const lastTwo = value % 100;
  const last = value % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return "райданчиков";
  }

  if (last === 1) {
    return "райданчик";
  }

  if (last >= 2 && last <= 4) {
    return "райданчика";
  }

  return "райданчиков";
}

export function formatReward(amount: number) {
  const sign = amount > 0 ? "+" : "";
  return `${sign}${amount} ${rewardWord(amount)}`;
}

export function formatBalance(amount: number) {
  return `${amount} ${rewardWord(amount)}`;
}
