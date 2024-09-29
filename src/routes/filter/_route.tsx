import { Button, CircularProgress, Modal, Snackbar, Tooltip, Typography } from "@mui/material";
import { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import {
	useCreateFilterGroupMutation,
	useDeleteFilterGroupsMutation,
	useGetFilterGroupListQuery,
	useUpdateFilterGroupMutation,
} from "@api/admin/filterGroup";
import { useEffect, useMemo, useState } from "react";

import ActionDialog from "@components/ActionDialog";
import { Add } from "@mui/icons-material";
import AdminTable from "../../components/ManagementTable";
import { FilterGroupCreateForm } from "./CreateForm";
import { FilterGroupGet } from "@appTypes/Filters";
import { FilterGroupUpdateForm } from "./UpdateForm";
import { LoadingSpinner } from "@components/LoadingSpinner";
import ManagementModal from "../../components/ManagementModal";
import { useLazyGetCategoryListQuery } from "@api/admin/category";

const columns: GridColDef<FilterGroupGet>[] = [
	{ field: "title", headerName: "Название" },
	{
		field: "category",
		headerName: "Категория",
		renderCell: (params) => params.row.category?.title || "Без привязки",
	},
	{
		field: "filters",
		headerName: "Значения",
		maxWidth: 600,
		renderCell: (params) => {
			const valuesString = params.row.filters.map(({ value }) => value).join(", ");
			return (
				<div className="ai-c d-f jc-c">
					<Tooltip title={valuesString}>
						<Typography>{valuesString}</Typography>
					</Tooltip>
				</div>
			);
		},
	},
	{ field: "createdAt", headerName: "Создан", type: "dateTime" },
	{ field: "updatedAt", headerName: "Обновлен", type: "dateTime" },
];

export default function FilterRoute() {
	const { data: filterGroupList, isLoading: filterGroupListIsLoading } = useGetFilterGroupListQuery({
		categoryId: undefined,
	});
	const [fetchCategoryList, { data: categoryList, isLoading: categoryListIsLoading }] = useLazyGetCategoryListQuery();
	const [createFilterGroup, { isSuccess: createIsSuccess, isLoading: createIsLoading, isError: createIsError }] =
		useCreateFilterGroupMutation();
	const [updateFilterGroup, { isSuccess: updateIsSuccess, isLoading: updateIsLoading, isError: updateIsError }] =
		useUpdateFilterGroupMutation();
	const [
		deleteFilterGroups,
		{ isSuccess: deleteFilterGroupsIsSuccess, isLoading: deleteIsLoading, isError: deleteFilterGroupsIsError },
	] = useDeleteFilterGroupsMutation();

	const [createModalOpened, setCreateModalOpened] = useState<boolean>(false);
	const [updateModalOpened, setUpdateModalOpened] = useState<boolean>(false);
	const [deletionDialogOpened, setDeletionDialogOpened] = useState<boolean>(false);

	const [snackbarOpened, setSnackbarOpened] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>("");

	const [selectedItemIds, setSelectedItemIds] = useState<GridRowSelectionModel>([]);

	const selectedFilterGroup = useMemo(() => {
		if (!filterGroupList) return null;
		return filterGroupList.items.find((filterGroup) => filterGroup.id === selectedItemIds[0]);
	}, [filterGroupList, selectedItemIds]);

	const showLoadingOverlay = createIsLoading || updateIsLoading || deleteIsLoading;

	const showSnackbarMessage = (message: string) => {
		setSnackbarMessage(message);
		setSnackbarOpened(true);
	};

	useEffect(() => {
		if (createIsSuccess) {
			showSnackbarMessage("Группа фильтров успешно создана");
			setCreateModalOpened(false);
		}
	}, [createIsSuccess]);

	useEffect(() => {
		if (updateIsSuccess) {
			showSnackbarMessage("Группа фильтров успешно обновлена");
			setUpdateModalOpened(false);
		}
	}, [updateIsSuccess]);

	useEffect(() => {
		if (deleteFilterGroupsIsSuccess) {
			showSnackbarMessage("Группа фильтров успешно удалена");
			setDeletionDialogOpened(false);
		}
	}, [deleteFilterGroupsIsSuccess]);

	useEffect(() => {
		if (createIsError) {
			showSnackbarMessage("Произошла ошибка при создании группы фильтров");
		}
	}, [createIsError]);

	useEffect(() => {
		if (updateIsError) {
			showSnackbarMessage("Произошла ошибка при обновлении группы фильтров");
		}
	}, [updateIsError]);

	useEffect(() => {
		if (deleteFilterGroupsIsError) {
			showSnackbarMessage("Произошла ошибка при удалении группы фильтров");
		}
	}, [deleteFilterGroupsIsError]);

	const handleStartCreate = () => {
		fetchCategoryList();
		setCreateModalOpened(true);
	};

	const handleStartUpdate = () => {
		fetchCategoryList();
		setUpdateModalOpened(true);
	};

	const handleStartDelete = () => {
		setDeletionDialogOpened(true);
	};

	return (
		<div className="px-3 pt-1 pb-4 h-100v d-f fd-c">
			<Modal open={showLoadingOverlay}>
				<div className="w-100v h-100v ai-c d-f jc-c" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
					<CircularProgress />
				</div>
			</Modal>

			<Snackbar
				open={snackbarOpened}
				autoHideDuration={2000}
				onClose={() => setSnackbarOpened(false)}
				message={snackbarMessage}
			/>

			<ManagementModal
				title="Создать группу фильтров"
				opened={createModalOpened}
				onClose={() => setCreateModalOpened(false)}
			>
				<FilterGroupCreateForm
					categoryList={categoryList}
					categoryListIsLoading={categoryListIsLoading}
					onSubmit={createFilterGroup}
				/>
			</ManagementModal>
			<ManagementModal
				title="Редактировать группу фильтров"
				opened={updateModalOpened}
				onClose={() => setUpdateModalOpened(false)}
			>
				{!selectedFilterGroup ? (
					<Typography variant="body2">Выберите группу</Typography>
				) : (
					<FilterGroupUpdateForm
						filterGroup={selectedFilterGroup}
						categoryList={categoryList}
						categoryListIsLoading={categoryListIsLoading}
						onSubmit={updateFilterGroup}
					/>
				)}
			</ManagementModal>
			<ActionDialog
				title="Удалить выбранные группы?"
				helperText="После удаления отменить действие будет невозможно"
				opened={deletionDialogOpened}
				onClose={() => setDeletionDialogOpened(false)}
				confirmButton={{
					text: "Удалить",
					onClick: () => {
						deleteFilterGroups(selectedItemIds.map(String));
					},
				}}
				declineButton={{
					text: "Отмена",
				}}
			/>
			<div className="p-2 d-f fd-r jc-sb">
				<div>
					<Typography variant="h5">Группы фильтров</Typography>
					<Typography variant="body2" color="typography.secondary">
						Количество: {filterGroupList?.items.length}
					</Typography>
				</div>
				<Button variant="contained" onClick={handleStartCreate}>
					<Add />
					Добавить
				</Button>
			</div>
			<LoadingSpinner isLoading={filterGroupListIsLoading}>
				{!filterGroupList ? (
					<div className="w-100 h-100v ai-c d-f jc-c">
						<Typography variant="h5">Что-то пошло не так</Typography>
					</div>
				) : (
					<AdminTable
						columns={columns}
						data={filterGroupList.items}
						onRowSelect={setSelectedItemIds}
						selectedRows={selectedItemIds}
						headerButtons={
							<>
								<Button
									variant="contained"
									disabled={!selectedItemIds.length}
									onClick={handleStartDelete}
								>
									Удалить
								</Button>
								<Button
									variant="contained"
									disabled={!selectedItemIds.length || selectedItemIds.length > 1}
									onClick={handleStartUpdate}
								>
									Редактировать
								</Button>
							</>
						}
					/>
				)}
			</LoadingSpinner>
		</div>
	);
}
