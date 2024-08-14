'use server';

import { z } from 'zod';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signOut } from '@/auth';


//schema for invoice --- omits date and id on form submission which will be provided later
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(
        {
            invalid_type_error: 'Please select a customer.',
        }
    ),
    amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'],{
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
  });

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
};

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      formData.append("redirectTo", "/")
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }

export async function User_Logout(){
  
    'use server';
    await signOut({redirectTo: "/auth/login"});
  
}
