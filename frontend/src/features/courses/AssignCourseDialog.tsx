import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useAuth } from '@/stores/authStore';

// 
interface User {
  _id: string;
  username: string;
}
// Define Course interface for currentCourse prop
interface Course {
  _id: string;
  name: string;
  desc: string;
}

export const AssignCourseDialog = ({
  isOpen,
  onOpenChange,
  currentCourse,
  assignTo,
  setAssignTo,
  handleAssignCourse,
  isAssigning,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentCourse: Course | null;
  assignTo: string;
  setAssignTo: (value: string) => void;
  handleAssignCourse: () => void;
  isAssigning: boolean;
}) => {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return; // Only fetch if dialog is open
      try {
        setIsLoadingUsers(true);
        const response = await fetch(`${API_BASE_URL}/users/getallUsers`, {
          headers: {
'Authorization': `Bearer ${accessToken || Cookies.get('access_token')}`,          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Non autorisé. Veuillez vous reconnecter.');
          }
          if (response.status === 404) {
            throw new Error('Endpoint utilisateurs non trouvé. Vérifiez la configuration du serveur.');
          }
          throw new Error(`Erreur réseau: ${response.status}`);
        }

        const data: { success: boolean; data: User[]; message?: string } = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Erreur lors du chargement des utilisateurs');
        }
        setUsers(data.data);
      } catch (err: any) {
        toast.error(err.message || 'Erreur lors du chargement des utilisateurs');
        console.error('Fetch users error:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-busy={isLoadingUsers || isAssigning}>
        <DialogHeader>
          <DialogTitle>Affecter le cours</DialogTitle>
          <DialogDescription>
            {currentCourse
              ? `Affecter le cours "${currentCourse.name}" à un utilisateur.`
              : 'Sélectionnez un cours pour l’affecter.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="assign-to" className="text-right">
              Utilisateur
            </Label>
            <Select
              value={assignTo}
              onValueChange={setAssignTo}
              disabled={isLoadingUsers || isAssigning || users.length === 0}
            >
              <SelectTrigger className="col-span-3" id="assign-to">
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingUsers ? (
                  <SelectItem value="loading" disabled>
                    Chargement...
                  </SelectItem>
                ) : users.length === 0 ? (
                  <SelectItem value="no-users" disabled>
                    Aucun utilisateur trouvé
                  </SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.username} 
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAssigning}>
            Annuler
          </Button>
          <Button
            onClick={handleAssignCourse}
            disabled={isAssigning || !assignTo || !currentCourse}
          >
            {isAssigning ? 'Affectation...' : 'Affecter le cours'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
