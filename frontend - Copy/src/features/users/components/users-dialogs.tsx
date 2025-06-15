import { useUsers } from '../context/users-context';
import { UsersActionDialog } from './users-action-dialog';
import { UsersDeleteDialog } from './users-delete-dialog';
import { UsersInviteDialog } from './users-invite-dialog';

export function UsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsers();

  return (
    <>
      <UsersActionDialog
        key="user-add"
        open={open === 'add'}
        onOpenChange={(state) => {
          if (!state) {
            setOpen(null); // Close the dialog by clearing the open state
          }
        }}
      />

      <UsersInviteDialog
        key="user-invite"
        open={open === 'invite'}
        onOpenChange={(state) => {
          if (!state) {
            setOpen(null); // Close the dialog
          }
        }}
      />

      {currentRow && (
        <>
          <UsersActionDialog
            key={`user-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={(state) => {
              if (!state) {
                setOpen(null); // Close the dialog
                setTimeout(() => {
                  setCurrentRow(null); // Clear currentRow after dialog closes
                }, 500);
              }
            }}
            currentRow={currentRow}
          />

          <UsersDeleteDialog
            key={`user-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={(state) => {
              if (!state) {
                setOpen(null); // Close the dialog
                setTimeout(() => {
                  setCurrentRow(null); // Clear currentRow after dialog closes
                }, 500);
              }
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  );
}