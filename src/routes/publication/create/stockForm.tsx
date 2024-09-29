import {
	Autocomplete,
	Button,
	CircularProgress,
	FormControl,
	FormHelperText,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography,
} from "@mui/material";
import { Control, Controller, useFieldArray, useForm } from "react-hook-form";
import { Delete, DragIndicator } from "@mui/icons-material";
import {
	DragDropContext,
	Draggable,
	DraggableProvidedDragHandleProps,
	DropResult,
	Droppable,
} from "react-beautiful-dnd";
import { useCallback, useEffect, useMemo } from "react";

import { CategoryGet } from "@appTypes/Category";
import { ProductGet } from "@appTypes/Product";
import { PublicationCreate } from "@appTypes/Publication";
import { SlugResolver } from "../utils";
import { getImageUrl } from "@utils/image";
import { handleIntChange } from "@utils/forms";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type CatalogItemPublishStockFormData = {
	product: ProductGet | null;
	price: number | null;
	quantity: number | null;
	discount: number | null;
};

const CatalogItemPublishStockResolver = z.object({
	product: z.object({ id: z.string({ message: "Выберите продукт" }) }, { message: "Выберите продукт" }),
	price: z.number({ message: "Укажите цену" }).positive({ message: "Цена должна быть положительным числом" }),
	quantity: z
		.number({ message: "Укажите количество" })
		.positive({ message: "Количество должно быть положительным числом" }),
	discount: z.number().positive({ message: "Скидка должна быть положительным числом" }).nullable(),
});

type PublicationCreateStockFormData = {
	link: string | null;
	categoryId: string | null;
	deliveryCostIncluded: null;
	items: CatalogItemPublishStockFormData[];
};

const PublicationCreateStockResolver = z.object({
	link: SlugResolver,
	categoryId: z.string({ message: "Выберите категорию" }).min(1, { message: "Выберите категорию" }),
	deliveryCostIncluded: z.null(),
	items: CatalogItemPublishStockResolver.array().nonempty({
		message: "У публикации должен быть хотя бы один товар",
	}),
});

interface ItemFormProps {
	index: number;
	control: Control<PublicationCreateStockFormData>;
	dragHandleProps: DraggableProvidedDragHandleProps | undefined | null;
	isSingle: boolean;
	onRemove: (index: number) => void;
	availableProducts: ProductGet[];
	productsLoading: boolean;
	selectedProducts: ProductGet[];
}

const ItemForm: React.FC<ItemFormProps> = ({
	index,
	control,
	dragHandleProps,
	isSingle,
	onRemove,
	availableProducts,
	productsLoading,
	selectedProducts,
}) => {
	return (
		<div key={index} className="gap-2 w-100 d-f fd-r">
			<IconButton {...dragHandleProps}>
				<DragIndicator />
			</IconButton>

			<div className="gap-1 w-100 d-f fd-c">
				<div className="ai-c d-f fd-r js-sb">
					<Typography variant="h6">{!isSingle ? `Вариация ${index + 1}` : "Товар"}</Typography>
					<IconButton onClick={() => onRemove(index)}>
						<Delete />
					</IconButton>
				</div>
				<div className="gap-2 pb-2 d-f fd-c">
					<Controller
						name={`items.${index}.product`}
						control={control}
						render={({ field: { onChange, value }, fieldState: { error } }) => (
							<Autocomplete
								fullWidth
								value={value}
								onChange={(_, data) => onChange(data)}
								options={availableProducts}
								loading={productsLoading}
								getOptionDisabled={(option) => selectedProducts.includes(option)}
								isOptionEqualToValue={(a, b) => a.id === b.id}
								getOptionLabel={(option) => option.title}
								renderOption={(props, option) => (
									<li className="gap-1 d-f fd-r" {...props}>
										<div
											style={{
												height: 40,
												width: 40,
												borderRadius: 6,
												overflow: "hidden",
											}}
										>
											<img
												src={getImageUrl(option.images.at(0)?.url ?? "", "small")}
												className="contain"
											/>
										</div>
										{option.title}
									</li>
								)}
								renderInput={(params) => (
									<TextField
										{...params}
										label="Продукт"
										required
										error={!!error}
										helperText={error?.message}
									/>
								)}
							/>
						)}
					/>
				</div>
				<div className="gap-2 d-f fd-r">
					<Controller
						name={`items.${index}.price`}
						control={control}
						render={({ field: { value, onChange }, fieldState: { error } }) => (
							<TextField
								fullWidth
								label="Цена"
								type="text"
								required
								value={value?.toString() || ""}
								onChange={handleIntChange(onChange)}
								variant="outlined"
								error={!!error}
								helperText={error?.message}
							/>
						)}
					/>

					<Controller
						name={`items.${index}.quantity`}
						control={control}
						render={({ field: { value, onChange }, fieldState: { error } }) => (
							<TextField
								fullWidth
								label="Количество"
								type="text"
								required
								value={value?.toString() || ""}
								onChange={handleIntChange(onChange)}
								variant="outlined"
								error={!!error}
								helperText={error?.message}
							/>
						)}
					/>

					<Controller
						name={`items.${index}.discount`}
						control={control}
						render={({ field: { value, onChange }, fieldState: { error } }) => (
							<TextField
								fullWidth
								label="Скидка"
								type="text"
								disabled
								value={value}
								onChange={(e) => {
									const value = parseInt(e.target.value, 10);
									if (!isNaN(value)) {
										onChange(value);
									}
								}}
								variant="outlined"
								error={!!error}
								helperText={error?.message}
							/>
						)}
					/>
				</div>
			</div>
		</div>
	);
};

interface getDefaultFormValuesArgs {
	products: ProductGet[];
	productIds?: string[];
}

const getDefaultFormValues = ({ products, productIds }: getDefaultFormValuesArgs) => {
	const defaultValues: PublicationCreateStockFormData = {
		link: null,
		categoryId: null,
		deliveryCostIncluded: null,
		items: [],
	};

	if (productIds) {
		let categoryId;
		const productsToAdd: ProductGet[] = [];

		for (const product of products) {
			if (productIds.includes(product.id)) {
				const productCategoryId = product.category.id;
				if (categoryId) {
					if (categoryId !== productCategoryId) {
						break;
					}
				} else {
					categoryId = productCategoryId;
				}
				productsToAdd.push(product);
			}
		}
		defaultValues.categoryId = categoryId || null;
		defaultValues.items = productsToAdd.map((product) => ({
			product,
			price: null,
			discount: null,
			quantity: null,
		}));
	} else {
		defaultValues.items.push({
			product: null,
			price: null,
			discount: null,
			quantity: null,
		});
	}
	return defaultValues;
};

type PublicationCreateStockFormProps = {
	productList?: { items: ProductGet[] } | undefined;
	productListIsLoading: boolean;
	categoryList?: { items: CategoryGet[] } | undefined;
	categoryListIsLoading: boolean;
	onSubmit: (data: PublicationCreate) => void;
	onDirty: () => void;
	productIds?: string[];
};

export const PublicationCreateStockForm: React.FC<PublicationCreateStockFormProps> = ({
	productList,
	productListIsLoading,
	categoryList,
	categoryListIsLoading,
	onSubmit,
	onDirty,
	productIds,
}) => {
	const formattedOnSubmit = useCallback(
		(data: PublicationCreateStockFormData) => {
			const formattedData = {
				link: data.link,
				categoryId: data.categoryId,
				preorderId: null,
				shippingCostIncluded: data.deliveryCostIncluded,
				items: data.items.map((itemVariation) => ({
					productId: itemVariation.product?.id,
					price: itemVariation.price,
					discount: itemVariation.discount,
					quantity: itemVariation.quantity,
					creditInfo: null,
				})),
			};
			onSubmit(formattedData as PublicationCreate);
		},
		[onSubmit]
	);

	const {
		control,
		handleSubmit,
		formState: { isDirty },
		setValue,
		watch,
	} = useForm<PublicationCreateStockFormData>({
		resolver: zodResolver(PublicationCreateStockResolver),
		defaultValues: getDefaultFormValues({ products: productList?.items || [], productIds }),
	});

	const {
		fields: variations,
		append: appendVariation,
		move: moveVariation,
		remove: removeVariation,
	} = useFieldArray({ control, name: "items" });

	useEffect(() => {
		if (isDirty) {
			onDirty();
		}
	}, [isDirty, onDirty]);

	const currentCategoryId = watch("categoryId");

	const availableProducts = useMemo(() => {
		if (!currentCategoryId) return [];
		return productList?.items.filter((product) => product.category.id === currentCategoryId);
	}, [currentCategoryId, productList]);

	const selectedProducts = watch("items")
		.map((itemVariation) => itemVariation.product)
		.filter((item) => item !== null);

	useEffect(() => {
		for (let i = 0; i < variations.length; i++) {
			const item = watch(`items.${i}`);

			if (item.product && item.product.category.id !== currentCategoryId) {
				setValue(`items.${i}.product`, null);
			}
		}
	}, [currentCategoryId, setValue, variations, watch]);

	const handleDragItemVariation = ({ source, destination }: DropResult) => {
		if (destination) {
			moveVariation(source.index, destination.index);
		}
	};

	return (
		<form className="gap-2 w-100 d-f fd-c" onSubmit={handleSubmit(formattedOnSubmit)} noValidate>
			<div className="gap-1 bg-primary p-3 br-3 d-f fd-c">
				<div className="gap-2 d-f fd-c">
					<Controller
						name="link"
						control={control}
						render={({ field, fieldState: { error } }) => (
							<TextField
								{...field}
								label="Ссылка"
								required
								variant="outlined"
								error={!!error}
								helperText={error?.message}
							/>
						)}
					/>

					<Controller
						name="categoryId"
						control={control}
						render={({ field, fieldState: { error } }) => (
							<FormControl fullWidth required>
								<InputLabel id="category-label">Категория</InputLabel>
								<Select
									labelId="category-label"
									label="Категория"
									variant="outlined"
									fullWidth
									{...field}
									error={!!error}
								>
									{!categoryList || categoryListIsLoading ? (
										<CircularProgress />
									) : (
										categoryList?.items.map((category) => (
											<MenuItem key={category.id} value={category.id}>
												{category.title}
											</MenuItem>
										))
									)}
								</Select>
								<FormHelperText error={!!error}>{error?.message}</FormHelperText>
							</FormControl>
						)}
					/>
				</div>
			</div>
			<div className="gap-1 bg-primary p-3 br-3 d-f fd-c">
				<DragDropContext onDragEnd={handleDragItemVariation}>
					<ul style={{ margin: 0, padding: 0, listStyleType: "none" }}>
						<Droppable droppableId="variations">
							{(provided) => (
								<div
									className="gap-1 w-100d-f fd-c"
									{...provided.droppableProps}
									ref={provided.innerRef}
								>
									{variations.map((item, index) => (
										<Draggable
											key={`itemVariation[${index}]`}
											draggableId={`itemVariation-${index}`}
											index={index}
										>
											{(provided) => (
												<li key={item.id} ref={provided.innerRef} {...provided.draggableProps}>
													<ItemForm
														index={index}
														control={control}
														dragHandleProps={provided.dragHandleProps}
														isSingle={variations.length === 1}
														onRemove={removeVariation}
														availableProducts={availableProducts || []}
														productsLoading={productListIsLoading}
														selectedProducts={selectedProducts}
													/>
												</li>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</ul>
				</DragDropContext>
				<Button
					sx={{ color: "warning.main" }}
					style={{ width: "fit-content" }}
					onClick={() =>
						appendVariation({
							product: null,
							price: null,
							discount: null,
							quantity: null,
						})
					}
				>
					Добавить вариацию
				</Button>
			</div>
			<div className="gap-1 bg-primary p-3 br-3 d-f fd-r">
				<Button variant="outlined">Сохранить черновик</Button>
				<Button type="submit" variant="contained">
					Опубликовать
				</Button>
			</div>
		</form>
	);
};
