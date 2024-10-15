import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Checkbox,
	Divider,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { AllInclusive, Check, Close, Delete, Edit, ExpandMore, Visibility, VisibilityOff } from "@mui/icons-material";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";

import ActionDialog from "@components/ActionDialog";
import { CatalogItemGet } from "@appTypes/CatalogItem";
import { CatalogItemUpdateSchema } from "@schemas/CatalogItem";
import { DiscountResolver } from "../utils";
import { getImageUrl } from "@utils/image";
import { handleIntChange } from "@utils/forms";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const textFieldProps = {
	onFocus: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>) => {
		event.stopPropagation();
		event.target.select();
	},
	sx: {
		width: "80%",
		"& .MuiInputBase-input": {
			fontSize: "1.2rem",
			color: "typography.primary",
		},
		"& .MuiInputBase-input.Mui-disabled": {
			WebkitTextFillColor: "#000000",
		},
	},
};

type VariationPreorderUpdateFormData = {
	id: string;
	rating: string;
	price: string;
	quantity: string | null;
	unlimitedQuantity: boolean;
	discount: {
		type: "FIXED" | "PERCENTAGE";
		value: string;
	} | null;
	quantityRestriction: string | null;
	creditPayments: {
		sum: string;
		deadline: Date | null;
	}[];
};

const VariationPreorderUpdateResolver = z.object({
	id: z.string({ message: "Выберите вариацию" }),
	rating: z.coerce
		.number({ message: "Укажите рейтинг" })
		.nonnegative({ message: "Рейтинг не может быть отрицательным числом" }),
	price: z.coerce.number({ message: "Укажите цену" }).positive({ message: "Цена должна быть положительным числом" }),
	quantity: z.coerce.number().positive({ message: "Количество должно быть положительным числом" }).nullable(),
	discount: DiscountResolver.nullable(),
	quantityRestriction: z.coerce
		.number()
		.positive({ message: "Количество должно быть положительным числом" })
		.nullable(),
	creditPayments: z
		.object({
			sum: z.coerce
				.number({ message: "Укажите сумму кредитного платежа" })
				.positive({ message: "Сумма должна быть положительным числом" }),
			deadline: z.date({ message: "Укажите срок действия кредитного платежа" }),
		})
		.array(),
});

interface VariationPreorderEditableCardProps {
	variation: CatalogItemGet;
	maxRating?: number;
	onUpdate: (data: z.infer<typeof CatalogItemUpdateSchema>) => void;
	updateSuccess: boolean;
	updateError: boolean;
	onDelete: ({ variationId }: { variationId: string }) => void;
	onActivate: ({ variationId }: { variationId: string }) => void;
	onDeactivate: ({ variationId }: { variationId: string }) => void;
}

const VariationPreorderEditableCard: React.FC<VariationPreorderEditableCardProps> = ({
	variation,
	maxRating,
	onUpdate,
	updateSuccess,
	updateError,
	onDelete,
	onActivate,
	onDeactivate,
}) => {
	const navigate = useNavigate();

	const {
		control,
		setValue,
		watch,
		handleSubmit,
		reset,
		formState: { isDirty },
	} = useForm<VariationPreorderUpdateFormData>({
		resolver: zodResolver(VariationPreorderUpdateResolver),
		defaultValues: {
			id: variation.id,
			rating: variation.rating.toString(),
			price: variation.price.toString(),
			quantity: variation.quantity?.toString() ?? null,
			unlimitedQuantity: variation.quantity === null,
			discount: variation.discount
				? {
						type: variation.discount.type,
						value: variation.discount.value.toString(),
				  }
				: null,
			quantityRestriction: variation.quantityRestriction?.toString() ?? null,
			creditPayments:
				variation.creditInfo?.payments.map((payment) => ({
					sum: payment.sum.toString(),
					deadline: payment.deadline,
				})) ?? [],
		},
	});

	const creditPayments = watch(`creditPayments`);
	const creditPaymentsTotal = creditPayments.reduce((acc, { sum }) => acc + (parseInt(sum) ?? 0), 0);

	const quantityIsUnlimited = watch(`unlimitedQuantity`);

	useEffect(() => {
		if (creditPayments.length > 0) {
			setValue(`price`, creditPaymentsTotal.toString());
		}
	}, [creditPaymentsTotal, setValue, creditPayments.length]);

	const [isEditing, setIsEditing] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [deletionDialogOpened, setDeletionDialogOpened] = useState(false);

	useEffect(() => {
		if (updateSuccess || updateError) {
			reset({
				id: variation.id,
				rating: variation.rating.toString(),
				price: variation.price.toString(),
				quantity: variation.quantity?.toString() ?? null,
				unlimitedQuantity: variation.quantity === null,
				discount: variation.discount
					? {
							type: variation.discount.type,
							value: variation.discount.value.toString(),
					  }
					: null,
				quantityRestriction: variation.quantityRestriction?.toString() ?? null,
				creditPayments:
					variation.creditInfo?.payments.map((payment) => ({
						sum: payment.sum.toString(),
						deadline: payment.deadline,
					})) ?? [],
			});
		}
	}, [variation, reset, updateSuccess, updateError]);

	const resolvedOnSubmit = (data: VariationPreorderUpdateFormData) => {
		onUpdate(CatalogItemUpdateSchema.parse(data));
		setIsEditing(false);
	};

	const handleStartEditing = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		setIsExpanded(true);
		setIsEditing(true);
	};

	const handleStopEditing = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		reset();
		setIsExpanded(false);
		setIsEditing(false);
	};

	const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		setDeletionDialogOpened(true);
	};

	const handleDelete = () => {
		onDelete({ variationId: variation.id });
	};

	const handleActivateClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		onActivate({ variationId: variation.id });
	};

	const handleDeactivateClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		onDeactivate({ variationId: variation.id });
	};

	const handleToggleExpand = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		if (isEditing) return;
		setIsExpanded(!isExpanded);
	};

	const handleProductInspectClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		navigate(`/product/inspect/${variation.product.id}`);
	};

	return (
		<>
			<ActionDialog
				title="Удалить вариацию публикации?"
				helperText="После удаления отменить действие будет невозможно"
				opened={deletionDialogOpened}
				onClose={() => setDeletionDialogOpened(false)}
				confirmButton={{
					text: "Удалить",
					onClick: handleDelete,
				}}
				declineButton={{
					text: "Отмена",
				}}
			/>

			<form onSubmit={handleSubmit(resolvedOnSubmit)}>
				<Accordion
					sx={{
						width: "100%",
						borderTop: "none",
						"&:before": {
							display: "none",
						},
					}}
					disableGutters
					expanded={isExpanded}
					onChange={() => {}}
				>
					<AccordionSummary
						onFocus={(event) => event.stopPropagation()}
						onBlur={(event) => event.stopPropagation()}
						role="presentation"
						tabIndex={-1}
						sx={{ cursor: "default!important" }}
					>
						<Stack
							sx={{ width: "100%" }}
							direction="row"
							alignItems="center"
							spacing={1}
							justifyContent="space-between"
							divider={<Divider orientation="vertical" />}
						>
							<div className="gap-1 w-100 ai-c d-f fd-r jc-fs">
								<Tooltip title="Перейти к товару">
									<IconButton sx={{ margin: 0, width: "100%" }} onClick={handleProductInspectClick}>
										<img
											src={getImageUrl(variation.product.images.at(0)?.url || "", "small")}
											style={{ width: 60, height: 60, objectFit: "cover" }}
										/>

										<Typography variant="subtitle0">{variation.product.title}</Typography>
									</IconButton>
								</Tooltip>
							</div>
							<div className="gap-1 d-f fd-c" style={{ width: "50%" }}>
								<Typography variant="body2" sx={{ color: "typography.secondary" }}>
									Доступна в каталоге
								</Typography>
								<Typography variant="subtitle0">
									{variation.isActive ? <Check /> : <Close />}
								</Typography>
							</div>

							<div className="gap-1 d-f fd-c" style={{ width: "50%" }}>
								<Typography variant="body2" sx={{ color: "typography.secondary" }}>
									Заказанное количество
								</Typography>
								<Typography variant="subtitle0">{variation.orderedQuantity}</Typography>
							</div>
							<div className="gap-1 d-f fd-c" style={{ width: "50%" }}>
								<div className="gap-1 ai-c d-f fd-r">
									<Typography variant="body2" sx={{ color: "typography.secondary" }}>
										Количество
									</Typography>
									<div className="d-f fd-r">
										<Checkbox
											checked={quantityIsUnlimited}
											onChange={(_, checked) => {
												if (checked) {
													setValue("unlimitedQuantity", true);
													setValue("quantity", null);
												} else {
													setValue("unlimitedQuantity", false);
													setValue("quantity", "");
												}
											}}
										/>
										<AllInclusive />
									</div>
								</div>
								<Controller
									name="quantity"
									control={control}
									render={({ field: { value, onChange }, fieldState: { error } }) => (
										<TextField
											{...textFieldProps}
											value={value ?? ""}
											onChange={handleIntChange(onChange)}
											variant={"standard"}
											disabled={!isEditing || quantityIsUnlimited}
											error={!!error}
											helperText={error?.message}
											slotProps={{
												input: {
													endAdornment: quantityIsUnlimited ? (
														<AllInclusive />
													) : (
														<InputAdornment position="end">шт.</InputAdornment>
													),
												},
											}}
										/>
									)}
								/>
							</div>
							<div className="gap-1 ai-fs d-f fd-c" style={{ width: "50%" }}>
								<Typography variant="body2" sx={{ color: "typography.secondary" }}>
									Цена
								</Typography>
								<Controller
									name="price"
									control={control}
									render={({ field: { value, onChange }, fieldState: { error } }) => (
										<TextField
											{...textFieldProps}
											value={value}
											onChange={handleIntChange(onChange)}
											variant={"standard"}
											disabled={!isEditing}
											error={!!error}
											helperText={error?.message}
											slotProps={{
												input: {
													endAdornment: <Typography variant="subtitle0">₽</Typography>,
												},
											}}
										/>
									)}
								/>
							</div>
							{/* <Controller
								name={`discount`}
								control={control}
								render={({
									field: { value: discount, onChange: onDiscountChange },
									fieldState: { error },
								}) => (
									<div className="gap-05 ai-fs d-f fd-c" style={{ width: "100%" }}>
										<div className="w-100 ai-c d-f fd-r">
											<Typography variant="body2" sx={{ color: "typography.secondary" }}>
												Скидка
											</Typography>
											<Checkbox
												disabled={!isEditing}
												checked={discount !== null}
												onChange={(_, checked) => {
													if (checked) {
														onDiscountChange({ type: "FIXED", value: "" });
													} else {
														onDiscountChange(null);
													}
												}}
											/>
										</div>
										<div className="gap-3 w-100 ai-c d-f fd-r jc-sb">
											<TextField
												{...textFieldProps}
												fullWidth
												type="text"
												disabled={!isEditing || discount === null}
												value={discount ? discount.value : "-"}
												onChange={handleIntChange((value) =>
													onDiscountChange({ ...discount, value })
												)}
												variant="standard"
												error={!!error}
												helperText={discountValueError || error?.message}
												slotProps={{
													input: {
														endAdornment: discount && (
															<InputAdornment position="end">
																{discount.type === "PERCENTAGE" ? "%" : "₽"}
															</InputAdornment>
														),
													},
												}}
											/>
											<div className="gap-05 ai-c d-f fd-r">
												<Typography variant="body2">₽</Typography>
												<Switch
													disabled={!isEditing || discount === null}
													checked={discount?.type === "PERCENTAGE"}
													onChange={(_, checked) =>
														onDiscountChange({
															type: checked ? "PERCENTAGE" : "FIXED",
															value: "",
														})
													}
												/>
												<Typography variant="body2">%</Typography>
											</div>
											{discount && (
												<Typography sx={{ width: "100%" }} variant="body2">
													Итог: {priceAfterDiscount}₽
												</Typography>
											)}
										</div>
									</div>
								)}
							/> */}
							<div className="gap-1 pl-2 d-f fd-r jc-c">
								{!isEditing ? (
									<>
										<Tooltip title="Редактировать">
											<IconButton
												onFocus={(event) => event.stopPropagation()}
												onClick={handleStartEditing}
											>
												<Edit />
											</IconButton>
										</Tooltip>
										<Tooltip title="Удалить">
											<IconButton
												sx={{ color: "error.main" }}
												onFocus={(event) => event.stopPropagation()}
												onClick={handleDeleteClick}
											>
												<Delete />
											</IconButton>
										</Tooltip>
									</>
								) : (
									<>
										<Tooltip title="Отменить">
											<IconButton
												sx={{ color: "error.main" }}
												onFocus={(event) => event.stopPropagation()}
												onClick={handleStopEditing}
											>
												<Close />
											</IconButton>
										</Tooltip>
										<Tooltip title="Сохранить">
											<IconButton
												sx={{ color: "success.main" }}
												onFocus={(event) => event.stopPropagation()}
												disabled={!isDirty}
												type="submit"
											>
												<Check />
											</IconButton>
										</Tooltip>
									</>
								)}
								{variation.isActive ? (
									<Tooltip title="Скрыть в каталоге">
										<IconButton
											onFocus={(event) => event.stopPropagation()}
											onClick={handleDeactivateClick}
											disabled={isEditing}
											sx={{ color: "error.main" }}
										>
											<VisibilityOff />
										</IconButton>
									</Tooltip>
								) : (
									<Tooltip title="Показать в каталоге">
										<IconButton
											onFocus={(event) => event.stopPropagation()}
											onClick={handleActivateClick}
											disabled={isEditing}
											sx={{ color: "success.main" }}
										>
											<Visibility />
										</IconButton>
									</Tooltip>
								)}
								<Tooltip title={isExpanded ? "Свернуть" : "Развернуть"}>
									<IconButton
										onFocus={(event) => event.stopPropagation()}
										onClick={handleToggleExpand}
										disabled={isEditing}
									>
										<ExpandMore
											sx={{
												transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
												transition: "transform 0.2s ease-in-out",
											}}
										/>
									</IconButton>
								</Tooltip>
							</div>
						</Stack>
					</AccordionSummary>
					<AccordionDetails>
						<Stack
							sx={{ width: "100%" }}
							direction="row"
							alignItems="center"
							spacing={1}
							justifyContent="space-between"
							divider={<Divider orientation="vertical" />}
						>
							<Controller
								name={`rating`}
								control={control}
								render={({ field: { value, onChange }, fieldState: { error } }) => (
									<div className="gap-05 d-f fd-c" style={{ width: "100%" }}>
										<Typography variant="body2" sx={{ color: "typography.secondary" }}>
											Рейтинг
										</Typography>
										<Typography variant="caption" sx={{ color: "typography.secondary" }}>
											<em>Текущий максимальный рейтинг: {maxRating}</em>
										</Typography>
										<TextField
											{...textFieldProps}
											fullWidth
											type="text"
											disabled={!isEditing}
											variant="standard"
											required
											value={value}
											onChange={handleIntChange(onChange)}
											error={!!error}
											helperText={error?.message}
										/>
									</div>
								)}
							/>

							<Controller
								name={`quantityRestriction`}
								control={control}
								render={({
									field: { value: quantityRestriction, onChange: onQuantityRestrictionChange },
									fieldState: { error },
								}) => (
									<div className="gap-05 ai-fs d-f fd-c" style={{ width: "100%" }}>
										<div className="w-100 ai-c d-f fd-r">
											<Typography variant="body2" sx={{ color: "typography.secondary" }}>
												Ограничение на аккаунт
											</Typography>
											<Checkbox
												disabled={!isEditing}
												checked={quantityRestriction !== null}
												onChange={(_, checked) => {
													if (checked) {
														onQuantityRestrictionChange("");
													} else {
														onQuantityRestrictionChange(null);
													}
												}}
											/>
										</div>

										<TextField
											{...textFieldProps}
											fullWidth
											type="text"
											disabled={!isEditing || quantityRestriction === null}
											value={quantityRestriction ?? "-"}
											onChange={handleIntChange(onQuantityRestrictionChange)}
											variant="standard"
											error={!!error}
											helperText={error?.message}
											slotProps={{
												input: {
													endAdornment: "шт.",
												},
											}}
										/>
									</div>
								)}
							/>
						</Stack>
					</AccordionDetails>
				</Accordion>
			</form>
		</>
	);
};

export { VariationPreorderEditableCard };
