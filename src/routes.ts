import dayjs from 'dayjs'
import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { prisma } from "./lib/prisma"

export async function appRoutes(app: FastifyInstance) {
  app.post('/habit', async (request) => {
    const createHabitBody = z.object({
      title: z.string(),
      weekdays: z.array(
        z.number().min(0).max(6)
      )
    })
    const { title, weekdays } = createHabitBody.parse(request.body)

    const today = dayjs().startOf('day').toDate()

    await prisma.habit.create({
      data: {
        title,
        created_at: today,
        habit_weekdays: {
          create: weekdays.map(weekday => {
            return {
              week_day: weekday
            }
          })
        }
      })
  })

  app.get('/day', async (request) => {
    const getDayParams = z.object({
      date: z.date()
    })

    const { date } = getDayParams.parse(request.params)

    const weekDay = dayjs(date).get('day')

    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          lte: date
        },
        habit_weekdays: {
          some: {
            week_day: weekDay
          }
        }
      },
    })

    return {
      possibleHabits,
    }
  })
}
