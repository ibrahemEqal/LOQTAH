import {sqliteTable,text,integer,primaryKey,index} from 'drizzle-orm/sqlite-core';
export const profiles=sqliteTable('profiles',{
 id:text('id').primaryKey(),name:text('name').notNull(),email:text('email').notNull(),business:text('business').notNull().default(''),phone:text('phone').notNull().default(''),city:text('city').notNull().default('نابلس'),createdAt:integer('created_at').notNull(),
});
export const favorites=sqliteTable('favorites',{
 userId:text('user_id').notNull().references(()=>profiles.id,{onDelete:'cascade'}),creatorId:text('creator_id').notNull(),
},t=>[primaryKey({columns:[t.userId,t.creatorId]})]);
export const campaigns=sqliteTable('campaigns',{
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>profiles.id,{onDelete:'cascade'}),title:text('title').notNull(),business:text('business').notNull(),category:text('category').notNull(),city:text('city').notNull(),brief:text('brief').notNull(),packageId:text('package_id').notNull(),budget:integer('budget').notNull(),date:text('date').notNull(),creatorId:text('creator_id'),status:text('status').notNull().default('requested'),createdAt:integer('created_at').notNull(),
},t=>[index('campaigns_user_idx').on(t.userId)]);
export const messages=sqliteTable('messages',{
 id:text('id').primaryKey(),campaignId:text('campaign_id').notNull().references(()=>campaigns.id,{onDelete:'cascade'}),authorId:text('author_id').notNull(),authorName:text('author_name').notNull(),body:text('body').notNull(),isTeam:integer('is_team',{mode:'boolean'}).notNull().default(false),createdAt:integer('created_at').notNull(),
},t=>[index('messages_campaign_idx').on(t.campaignId)]);
export const deliverables=sqliteTable('deliverables',{
 id:text('id').primaryKey(),campaignId:text('campaign_id').notNull().references(()=>campaigns.id,{onDelete:'cascade'}),title:text('title').notNull(),url:text('url').notNull(),status:text('status').notNull().default('review'),feedback:text('feedback').notNull().default(''),createdAt:integer('created_at').notNull(),
});
export const applications=sqliteTable('creator_applications',{
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>profiles.id,{onDelete:'cascade'}).unique(),name:text('name').notNull(),city:text('city').notNull(),category:text('category').notNull(),portfolio:text('portfolio').notNull(),bio:text('bio').notNull(),phone:text('phone').notNull(),status:text('status').notNull().default('pending'),createdAt:integer('created_at').notNull(),
});
