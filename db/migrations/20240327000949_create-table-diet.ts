import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('diet', (table) => {
    table.uuid('id').primary()
    table.uuid('user_id').index()
    table.text('name').notNullable()
    table.text('description').notNullable()
    table.boolean('is_on_diet').notNullable()
    table.dateTime('date')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('diet')
}
