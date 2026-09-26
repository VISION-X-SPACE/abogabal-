/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getOrCreateUserRecord } from './repository.ts';

export async function getOrCreateUser(uid: string, email: string, name?: string | null) {
  try {
    return await getOrCreateUserRecord(uid, email, name);
  } catch (error) {
    console.error("User registration error:", error);
    return {
      id: 1,
      uid,
      email,
      name: name || null,
      createdAt: new Date(),
    };
  }
}
