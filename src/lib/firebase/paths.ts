export const fsPath = {
  users: () => "users",
  user: (uid: string) => `users/${uid}`,
  households: () => "households",
  household: (hid: string) => `households/${hid}`,
  items: (hid: string) => `households/${hid}/items`,
  item: (hid: string, itemId: string) => `households/${hid}/items/${itemId}`,
  shoppingList: (hid: string) => `households/${hid}/shoppingList`,
  shoppingListItem: (hid: string, itemId: string) =>
    `households/${hid}/shoppingList/${itemId}`,
  categories: (hid: string) => `households/${hid}/categories`,
  category: (hid: string, categoryId: string) =>
    `households/${hid}/categories/${categoryId}`,
};
