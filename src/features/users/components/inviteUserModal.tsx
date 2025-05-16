import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Button } from '@/components/ui/button'

type Props = {
  onClose: () => void
}

export const InviteUserModal = ({ onClose }: Props) => {
  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <DialogPanel className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <DialogTitle className="text-lg font-bold mb-4">Invite a User</DialogTitle>
        <input
          type="email"
          placeholder="Enter email"
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button>Send Invite</Button>
        </div>
      </DialogPanel>
    </Dialog>
  )
}
