/**
 * User Role Setup Utility
 * 
 * This file helps you set up user roles in Firebase.
 * Run this once to assign roles to your users.
 * 
 * TEACHERS: Can create, edit, delete sessions
 * STUDENTS: Can only view sessions (read-only)
 */

import { setUserRole } from '@/lib/firebase/roles'

/**
 * Setup Teacher Role
 * Call this function to assign teacher role to a user
 * 
 * Example usage in browser console:
 * ```
 * import { setupTeacher } from '@/lib/firebase/setup-roles'
 * await setupTeacher('user-uid-here', 'teacher@example.com')
 * ```
 */
export async function setupTeacher(uid: string, email: string, displayName?: string) {
  try {
    await setUserRole(uid, email, 'teacher', displayName)
    console.log(`✅ Successfully set ${email} as TEACHER`)
  } catch (error) {
    console.error('❌ Failed to set teacher role:', error)
  }
}

/**
 * Setup Student Role
 * Call this function to assign student role to a user
 */
export async function setupStudent(uid: string, email: string, displayName?: string) {
  try {
    await setUserRole(uid, email, 'student', displayName)
    console.log(`✅ Successfully set ${email} as STUDENT`)
  } catch (error) {
    console.error('❌ Failed to set student role:', error)
  }
}

/**
 * Quick Setup for Multiple Teachers
 * Add your teacher emails here
 */
export async function setupTeachers() {
  const teachers = [
    // Add your teacher emails here
    // Example: { email: 'teacher@school.com', displayName: 'Mr. Smith' }
  ]
  
  console.log('Setting up teachers...')
  console.log('Note: You need to get the user UID from Firebase Authentication first')
  console.log('Then use setupTeacher(uid, email, displayName) for each teacher')
}

/**
 * How to use:
 * 
 * 1. Go to Firebase Console -> Authentication
 * 2. Find the user and copy their UID
 * 3. In your app, run:
 * 
 *    import { setupTeacher } from '@/lib/firebase/setup-roles'
 *    await setupTeacher('PASTE_UID_HERE', 'teacher@email.com', 'Teacher Name')
 * 
 * 4. The user will now have teacher permissions
 * 
 * Note: Users without a role assigned will default to STUDENT (read-only)
 */
