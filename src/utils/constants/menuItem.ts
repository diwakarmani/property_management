export const menuItems: { menu: { name: string, icon: string, path: string }[], account: { name: string, icon: string, path: string }[], } = {
    menu: [{ name: 'Home', icon: 'home', path: 'Home' },
    { name: "Search Properties", icon: 'search', path: 'Search' },
    { name: "My Saved", icon: 'bookmark', path: 'MyFavourites' },
    { name: "Notification", icon: 'notifications-outline', path: 'NotificationScreen' }],
    account: [{ name: 'Edit Profile', icon: 'person-outline', path: 'Profile' },
    { name: "Settings", icon: 'settings', path: 'Settings' },
    { name: "Help & Support", icon: 'help-circle-outline', path: 'Help' }]
}
