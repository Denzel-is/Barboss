import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { PrismaClient, Role } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const users = [
  {
    username: "admin",
    password: "drayaparol",
    role: Role.admin,
  },
  {
    username: "rayakrutaya2006",
    password: "rayakrutaya2006",
    role: Role.participant,
  },
];

const tasks = [
  {
    title: "Пройти 5750 шагов",
    description: "Пройди 5750 шагов за день и отправь доказательство.",
    category: "Ежедневные",
    reward: 8,
    proofType: "video",
    isDaily: true,
    isPenalty: false,
  },
  {
    title: "Почистить зубы",
    description: "Почисти зубы и отметь выполнение.",
    category: "Ежедневные",
    reward: 1,
    proofType: "video",
    isDaily: true,
    isPenalty: false,
  },
  {
    title: "Не есть Мак 1 день",
    description: "Продержись день без Мака.",
    category: "Ежедневные",
    reward: 3,
    proofType: "video",
    isDaily: true,
    isPenalty: false,
  },
  {
    title: "Не пить сладкое 1 день",
    description: "Продержись день без сладких напитков.",
    category: "Ежедневные",
    reward: 3,
    proofType: "video",
    isDaily: true,
    isPenalty: false,
  },
  {
    title: "Быть доброй весь день",
    description: "Быть доброй весь день и рассказать, как получилось.",
    category: "Ежедневные",
    reward: 8,
    proofType: "video",
    isDaily: true,
    isPenalty: false,
  },
  {
    title: "Встать с кровати раньше 11:00",
    description: "Встать раньше 11:00 и отправить видео-доказательство.",
    category: "Ежедневные",
    reward: 6,
    proofType: "video",
    isDaily: true,
    isPenalty: false,
  },
  {
    title: "10 приседаний",
    description: "Сделать 10 приседаний.",
    category: "Спорт",
    reward: 2,
    proofType: "video",
    isDaily: false,
    isPenalty: false,
  },
  {
    title: "Планка 10 секунд",
    description: "Простоять в планке 10 секунд.",
    category: "Спорт",
    reward: 5,
    proofType: "video",
    isDaily: false,
    isPenalty: false,
  },
  {
    title: "Пресс 20 раз",
    description: "Сделать пресс 20 раз.",
    category: "Спорт",
    reward: 8,
    proofType: "video",
    isDaily: false,
    isPenalty: false,
  },
  {
    title: "Помыться и уложиться на встречу",
    description: "Подготовиться к встрече: помыться и уложиться.",
    category: "Встреча",
    reward: 7,
    proofType: "video",
    isDaily: false,
    isPenalty: false,
  },
  {
    title: "Не помыться на встречу",
    description: "Штраф за встречу без подготовки.",
    category: "Встреча",
    reward: -10,
    proofType: "video",
    isDaily: false,
    isPenalty: true,
  },
  {
    title: "Накраситься на встречу",
    description: "Накраситься на встречу.",
    category: "Встреча",
    reward: 7,
    proofType: "video",
    isDaily: false,
    isPenalty: false,
  },
  {
    title: "Обнимашки 30 секунд",
    description: "Обнимашки минимум 30 секунд.",
    category: "Милые бонусы",
    reward: 1,
    proofType: "video",
    isDaily: false,
    isPenalty: false,
  },
  {
    title: "Поцеловать в щеку",
    description: "Поцеловать в щеку.",
    category: "Милые бонусы",
    reward: 1,
    proofType: "video",
    isDaily: false,
    isPenalty: false,
  },
  {
    title: "Поцелуй в губы 1.5 секунды",
    description: "Поцелуй в губы 1.5 секунды.",
    category: "Милые бонусы",
    reward: 2,
    proofType: "video",
    isDaily: false,
    isPenalty: false,
  },
  {
    title: "Французский поцелуй 1 минута",
    description: "Французский поцелуй 1 минуту.",
    category: "Милые бонусы",
    reward: 4,
    proofType: "video",
    isDaily: false,
    isPenalty: false,
  },
  {
    title: "Отправить 6 кружочков себя по 10 секунд",
    description: "Отправить 6 видео-кружочков по 10 секунд.",
    category: "Видео / внимание",
    reward: 4,
    proofType: "video",
    isDaily: false,
    isPenalty: false,
  },
  {
    title: "Погулять с Ричи 10+ минут",
    description: "Погулять с Ричи не меньше 10 минут.",
    category: "Ричи",
    reward: 1,
    proofType: "video",
    isDaily: false,
    isPenalty: false,
  },
  {
    title: "Поесть фастфуд",
    description: "Штраф за фастфуд.",
    category: "Штрафы",
    reward: -10,
    proofType: "video",
    isDaily: false,
    isPenalty: true,
  },
  {
    title: "Пить/есть сладкое",
    description: "Штраф за один сладкий товар.",
    category: "Штрафы",
    reward: -2,
    proofType: "video",
    isDaily: false,
    isPenalty: true,
  },
];

const shopItems = [
  {
    title: "Кино",
    description: "Поход в кино.",
    price: 220,
  },
  {
    title: "Басик",
    description: "Поход в бассейн.",
    price: 270,
  },
  {
    title: "Мак",
    description: "Поход в Мак.",
    price: 300,
  },
  {
    title: "Суши",
    description: "Суши.",
    price: 340,
  },
  {
    title: "Дариджане",
    description: "Дариджане.",
    price: 400,
  },
];

async function main() {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        passwordHash,
        role: user.role,
      },
      create: {
        username: user.username,
        passwordHash,
        role: user.role,
      },
    });
  }

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { title: task.title },
      update: {
        description: task.description,
        category: task.category,
        reward: task.reward,
        proofType: task.proofType,
        isDaily: task.isDaily,
        isPenalty: task.isPenalty,
        isActive: true,
      },
      create: {
        ...task,
        isActive: true,
      },
    });
  }

  for (const item of shopItems) {
    await prisma.shopItem.upsert({
      where: { title: item.title },
      update: {
        description: item.description,
        price: item.price,
        isActive: true,
      },
      create: {
        ...item,
        isActive: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
