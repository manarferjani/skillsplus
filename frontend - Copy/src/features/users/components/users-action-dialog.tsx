import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addUserWithEmail } from '@/services/users.service'
import { updateUser } from '@/services/users.service'
// Adaptez le chemin
import toast, { Toaster } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'
import { userTypes } from '../data/data'
import { User } from '../data/schema'
import { deleteUser } from '@/services/users.service'

type UserStatus = 'active' | 'inactive' | 'blocked' | 'suspended' | 'pending';

const formSchema = z
  .object({
    name: z.string().min(1, { message: 'Name is required.' }),

    email: z
      .string()
      .min(1, { message: 'Email is required.' })
      .email({ message: 'Email is invalid.' }),
    password: z.string().transform((pwd) => pwd.trim()),
    role: z.string().min(1, { message: 'Role is required.' }),
    gender: z.enum(['male', 'female', 'other'], {
      errorMap: () => ({ message: 'Gender is required.' }),
    }),
    status: z.enum(['active', 'inactive', 'blocked', 'suspended','pending'], {
      errorMap: () => ({ message: 'Status is required' }),
    }),

    level: z.string().optional(),
    jobPosition: z.string().min(1, { message: 'Job position is required.' }),
    confirmPassword: z.string().transform((pwd) => pwd.trim()),
    clerkId: z.string().optional(),
    isEdit: z.boolean(),
  })
  .superRefine(({ isEdit, password, confirmPassword, role, level }, ctx) => {
    if (!isEdit || (isEdit && password !== '')) {
      if (password === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password is required.',
          path: ['password'],
        })
      }

      if (password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must be at least 8 characters long.',
          path: ['password'],
        })
      }

      if (!password.match(/[a-z]/)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must contain at least one lowercase letter.',
          path: ['password'],
        })
      }

      if (!password.match(/\d/)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must contain at least one number.',
          path: ['password'],
        })
      }

      if (password !== confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords don't match.",
          path: ['confirmPassword'],
        })
      }
      if (role === 'collaborator' && (!level || level.trim() === '')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Level is required for collaborator role.',
          path: ['level'],
        })
      }
    }
  })
type UserForm = z.infer<typeof formSchema>

interface Props {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}
const collaboratorLevels = [
  { label: 'Junior', value: 'junior' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Senior', value: 'senior' },
]

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
]
const allowedGenders = ['male', 'female', 'other'] as const;
type AllowedGender = typeof allowedGenders[number];

// Helper function to narrow the gender type
function parseGender(gender: string): AllowedGender {
  return allowedGenders.includes(gender as AllowedGender)
    ? (gender as AllowedGender)
    : 'male'; // or any default fallback
}


export function UsersActionDialog({ currentRow, open, onOpenChange }: Props) {
  const isEdit = !!currentRow
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          ...currentRow,
          password: '',
          confirmPassword: '',
          isEdit,
          status: (currentRow.status as UserStatus) || 'active',
          gender: parseGender(currentRow.gender), // safe assignment
        }
      : {
          name: '',
          email: '',
          role: '',
          password: '',
          confirmPassword: '',
          isEdit,
          status: 'active',
          gender: 'male',
        },
  })

// Modifiez votre fonction onSubmit comme ceci :
const onSubmit = async (values: UserForm) => {
  try {
    if (isEdit && currentRow) {
      await updateUser(currentRow.id, {
        name: values.name,
        email: values.email,
        role: values.role as 'admin' | 'manager' | 'collaborator',
        jobPosition: values.jobPosition as 
          | 'fullStackDeveloper'
          | 'frontendDeveloper'
          | 'backendDeveloper'
          | 'unspecified',
        status: values.status as 'active' | 'inactive' | 'suspended' | 'blocked', // Retirez 'pending'
        gender: values.gender,
      });
    } else {
      const userData = {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        jobPosition: values.jobPosition,
        status: values.status as 'active' | 'inactive' | 'suspended' | 'blocked', // Retirez 'pending'
        gender: values.gender,
      };
      console.log('Envoi des données:', userData); // Ajoutez ce log
      await addUserWithEmail(userData);
    }
    onOpenChange(false);
  } catch (error) {
    toast.error(
      isEdit
        ? "Erreur lors de la mise à jour de l'utilisateur"
        : "Erreur lors de l'ajout de l'utilisateur"
    );
  }
};

  const isPasswordTouched = !!form.formState.dirtyFields.password

  return (
    <>
      <Toaster />
      <Dialog
        open={open}
        onOpenChange={(state) => {
          form.reset()
          onOpenChange(state)
        }}
      >
        <DialogContent className='!rounded-3xl sm:max-w-lg'>
          <DialogHeader className='text-left'>
            <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Update the user here. ' : 'Create new user here. '}
              Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className='-mr-4 h-[26.25rem] w-full overflow-y-auto py-1 pr-4'>
            <Form {...form}>
              <form
                id='user-form'
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4 p-0.5'
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                      <FormLabel className='col-span-2 text-right'>
                        Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='John Doe'
                          className='col-span-4'
                          autoComplete='off'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                      <FormLabel className='col-span-2 text-right'>
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='john.doe@gmail.com'
                          className='col-span-4'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='gender'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                      <FormLabel className='col-span-2 text-right'>
                        Gender
                      </FormLabel>
                      <SelectDropdown
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        placeholder='Select a gender'
                        className='col-span-4'
                        items={genderOptions}
                      />
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                      <FormLabel className='col-span-2 text-right'>
                        Role
                      </FormLabel>
                      <SelectDropdown
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        placeholder='Select a role'
                        className='col-span-4'
                        items={userTypes.map(({ label, value }) => ({
                          label,
                          value,
                        }))}
                      />
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
                {form.watch('role') === 'collaborator' && (
                  <FormField
                    control={form.control}
                    name='level'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                        <FormLabel className='col-span-2 text-right'>
                          Level
                        </FormLabel>
                        <SelectDropdown
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          placeholder='Select a level'
                          className='col-span-4'
                          items={collaboratorLevels}
                        />
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name='jobPosition'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                      <FormLabel className='col-span-2 text-right'>
                        Job Position
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g., Full Stack Developer'
                          className='col-span-4'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                      <FormLabel className='col-span-2 text-right'>
                        Password
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder='e.g., S3cur3P@ssw0rd'
                          className='col-span-4'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                      <FormLabel className='col-span-2 text-right'>
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          disabled={!isPasswordTouched}
                          placeholder='e.g., S3cur3P@ssw0rd'
                          className='col-span-4'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                      <FormLabel className='col-span-2 text-right'>
                        Status
                      </FormLabel>
                      <SelectDropdown
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        placeholder='Select status'
                        className='col-span-4'
                        items={[
                          { label: 'Active', value: 'active' },
                          { label: 'Inactive', value: 'inactive' },
                          { label: 'Blocked', value: 'blocked' },
                        ]}
                      />
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          <DialogFooter>
            <Button
              type='submit'
              form='user-form'
              className='rounded-3xl text-black transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg'
              style={{ backgroundColor: '#cec5fc' }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
