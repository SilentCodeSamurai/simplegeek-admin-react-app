import { ISOToDateSchema, IdSchema } from "./Primitives";

import { CategoryGetSchema } from "./Category";
import { z } from "zod";

export const FilterGroupNewSchema = z
	.object({
		id: IdSchema.nullable(),
		title: z.string(),
		filters: z
			.object({
				id: IdSchema.nullable(),
				value: z.string(),
			})
			.array()
			.nonempty(),
	})
	.describe("FilterGroupNew");

export const FilterGroupCreateSchema = z
	.object({
		categoryId: IdSchema.nullable(),
		title: z.string(),
		filters: z
			.object({
				value: z.string(),
			})
			.array(),
	})
	.describe("FilterGroupCreate");

export const FilterGroupUpdateSchema = z
	.object({
		id: z.string(),
		categoryId: z.string().nullable(),
		title: z.string(),
		filters: z
			.object({
				id: z.string().nullable(),
				value: z.string(),
			})
			.array(),
	})
	.describe("FilterGroupUpdate");

export const FilterGroupGetSchema = z
	.object({
		id: IdSchema,
		createdAt: ISOToDateSchema,
		updatedAt: ISOToDateSchema,
		title: z.string(),
		category: CategoryGetSchema.nullable(),
		filters: z
			.object({
				id: IdSchema,
				value: z.string(),
			})
			.array()
			.nonempty(),
	})
	.describe("FilterGroupGet");

export const FilterGroupListGetSchema = z
	.object({
		items: FilterGroupGetSchema.array(),
	})
	.describe("FilterGroupListGet");
