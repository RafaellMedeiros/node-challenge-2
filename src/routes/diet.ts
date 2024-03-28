import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../middleware/check-user-id-exists'

export async function dietRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { userId } = request.cookies

    const diet = await knex('diet').where('user_id', userId).select()

    return { diet }
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const getDietParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { userId } = request.cookies

    const { id } = getDietParamsSchema.parse(request.params)

    const diet = await knex('diet')
      .where({
        user_id: userId,
        id,
      })
      .select()

    return { diet }
  })

  app.put(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createDietBodySchema = z.object({
        id: z.string().uuid(),
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
      })

      const { userId } = request.cookies

      const { id, description, isOnDiet, name } = createDietBodySchema.parse(
        request.body,
      )

      const diet = await knex('diet')
        .where({
          user_id: userId,
          id,
        })
        .select()

      if (diet === null) {
        return reply.status(404).send({
          error: 'Diet não encontrada',
        })
      }

      await knex('diet').where('id', id).update({
        name,
        description,
        is_on_diet: isOnDiet,
      })

      return reply.status(200).send()
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createDietParamsSchema = z.object({ id: z.string().uuid() })

      const { userId } = request.cookies

      const { id } = createDietParamsSchema.parse(request.params)

      const diet = await knex('diet')
        .where({
          user_id: userId,
          id,
        })
        .select()

      if (diet === null) {
        return reply.status(404).send({
          error: 'Diet não encontrada',
        })
      }

      await knex('diet').where('id', id).delete()

      return reply.status(204).send()
    },
  )

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const { userId } = request.cookies

      const diets = await knex('diet').where('user_id', userId).select()

      let totalDiet = 0
      let totalNoDiet = 0
      let bestSequenceDiet = 0
      let currentSequence = 0

      for (const diet of diets) {
        if (diet.is_on_diet) {
          totalDiet++
          currentSequence++
          bestSequenceDiet = Math.max(bestSequenceDiet, currentSequence)
        } else {
          totalNoDiet++
          currentSequence = 0
        }
      }

      return {
        total: diets.length,
        total_diet: totalDiet,
        total_no_diet: totalNoDiet,
        best_sequence_diet: bestSequenceDiet,
      }
    },
  )

  app.post('/', async (request, reply) => {
    const createDietBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      isOnDiet: z.boolean(),
    })

    const { name, description, isOnDiet } = createDietBodySchema.parse(
      request.body,
    )

    let userId = request.cookies.userId

    if (!userId) {
      userId = randomUUID()

      reply.cookie('userId', userId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('diet').insert({
      id: randomUUID(),
      name,
      description,
      is_on_diet: isOnDiet,
      date: new Date().toString(),
      user_id: userId,
    })

    return reply.status(201).send()
  })
}
