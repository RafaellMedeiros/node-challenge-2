// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    diet: {
      id: string
      name: string
      description: string
      user_id: string
      date: string
      is_on_diet: boolean
    }
  }
}
