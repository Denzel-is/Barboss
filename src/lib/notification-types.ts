export const NOTIFICATION_TYPES = {
  taskSubmitted: "task_submitted",
  taskApproved: "task_approved",
  taskRejected: "task_rejected",
  rewardCredited: "reward_credited",
  shopPurchased: "shop_purchased",
  shopSale: "shop_sale",
  chatMessage: "chat_message",
  siteError: "site_error",
  info: "info",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const TOAST_KEYS = {
  taskSubmitted: "task_submitted",
  taskApproved: "task_approved",
  taskRejected: "task_rejected",
  rewardCredited: "reward_credited",
  shopPurchased: "shop_purchased",
  error: "error",
} as const;

export type ToastKey = (typeof TOAST_KEYS)[keyof typeof TOAST_KEYS];

export const TOAST_MESSAGES: Record<ToastKey, { title: string; tone: "success" | "error" | "info" }> = {
  task_submitted: { title: "Задание отправлено на проверку", tone: "success" },
  task_approved: { title: "Задание принято", tone: "success" },
  task_rejected: { title: "Задание отклонено", tone: "error" },
  reward_credited: { title: "Райданчики начислены", tone: "success" },
  shop_purchased: { title: "Покупка оформлена", tone: "success" },
  error: { title: "Произошла ошибка", tone: "error" },
};
