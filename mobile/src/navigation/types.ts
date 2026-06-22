export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  RegisterChoice: undefined;
  RegisterDonor: undefined;
  RegisterOrganization: undefined;
};

export type HomeStackParamList = {
  HomeRoot: undefined;
  RequestDetail: { id: string };
  NewRequest: undefined;
};

export type RequestsStackParamList = {
  RequestsList: undefined;
  RequestDetail: { id: string };
  NewRequest: undefined;
};

export type SearchStackParamList = {
  SearchRoot: undefined;
};

export type NotificationsStackParamList = {
  NotificationsList: undefined;
  RequestDetail: { id: string };
};

export type ProfileStackParamList = {
  ProfileRoot: undefined;
  EditDonorProfile: undefined;
  Inventory: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Requests: undefined;
  Search: undefined;
  Notifications: undefined;
  Profile: undefined;
};
