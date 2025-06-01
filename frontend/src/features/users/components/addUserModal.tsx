import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Button } from '@/components/ui/button'

type Props = {
  onClose: () => void
}

export const AddUserModal = ({ onClose }: Props) => {
  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <DialogPanel className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <DialogTitle className="text-lg font-bold mb-4">Add a User</DialogTitle>
        
        <input
          type="text"
          placeholder="Name"
          className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
        />
        
        <input
          type="email"
          placeholder="Email"
          className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
        />
        
        <select className="w-full border border-gray-300 rounded px-3 py-2 mb-4">
          <option value="">Select role</option>
          <option value="collaborator">Collaborator</option>
          <option value="manager">Manager</option>
        </select>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button>Add User</Button>
        </div>
      </DialogPanel>
    </Dialog>
  )
}
