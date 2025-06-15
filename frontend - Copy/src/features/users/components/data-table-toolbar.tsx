import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { userTypes } from '../data/data'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { DataTableViewOptions } from './data-table-view-options'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  isPendingView?: boolean
}

export function DataTableToolbar<TData>({
  table,
  isPendingView = false,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Filter users...'
          value={
            (table.getColumn('username')?.getFilterValue() as string) ?? ''
          }
          onChange={(event) =>
            table.getColumn('username')?.setFilterValue(event.target.value)
          }
          className='h-8 w-[150px] lg:w-[250px] rounded-3xl'
        />
        <div className='flex gap-x-2'>
          {isPendingView ? (
            // Affiche le filtre Position si on est sur la vue pending
            table.getColumn('jobPosition') && (
              <DataTableFacetedFilter
                column={table.getColumn('jobPosition')}
                title='Position'
                options={[
                  { label: 'Manager', value: 'manager' },
                  { label: 'Developer', value: 'developer' },
                  { label: 'Designer', value: 'designer' },
                  { label: 'Intern', value: 'intern' },
                ]}
              />
            )
          ) : (
            <>
              {table.getColumn('status') && (
                <DataTableFacetedFilter
                  column={table.getColumn('status')}
                  title='Status'
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                    { label: 'Invited', value: 'invited' },
                    { label: 'Suspended', value: 'suspended' },
                  ]}
                />
              )}
              {table.getColumn('role') && (
                <DataTableFacetedFilter
                  column={table.getColumn('role')}
                  title='Role'
                  options={userTypes.map((t) => ({ ...t }))}
                />
              )}
            </>
          )}
        </div>

        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => table.resetColumnFilters()}
            className='h-8 px-2 lg:px-3'
          >
            Reset
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>

      <DataTableViewOptions table={table} />
    </div>
  )
}
