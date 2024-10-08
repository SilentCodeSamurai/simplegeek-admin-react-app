import { z } from "zod";

export const SlugResolver = z.string({ message: "Укажите ссылку" }).regex(/^[a-zA-Z0-9-_а-яА-ЯёЁ]+$/, {
	message: "Ссылка может включать только латинские или русские буквы, цифры, дефис и нижнее подчеркивание",
});

export const DiscountResolver = z
	.object({
		type: z.enum(["FIXED", "PERCENTAGE"]),
		value: z
			.string()
			.min(1, { message: "Укажите скидку" })
			.pipe(
				z.coerce
					.number({ message: "Укажите скидку" })
					.positive({ message: "Скидка должна быть положительным числом" })
			),
	})
	.refine((data) => (data.type === "PERCENTAGE" ? data.value <= 100 : true), {
		message: "Процент не может превышать 100%",
		path: ["value"],
	});
