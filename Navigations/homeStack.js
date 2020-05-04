import {createStackNavigator} from 'react-navigation-stack'
import {createAppContainer} from 'react-navigation'
import Login from '../Screens/Login';
import Register from '../Screens/Register';
import Home from '../Screens/Home';
import Main from '../Screens/Main';
import Chat from '../Screens/Chat';
import Profile from '../Screens/Profile';
import Channel_Profile from '../Screens/Channel_profile'
// navigation prop is passed down to all our screen components.
const HomeStack = createStackNavigator({
    // Top Screen is showed by default
    
    Main:{
        screen:Main
    },
    Login: {
        screen: Login,
    },
    Register: {
        screen: Register
    },
    Home: {
        screen: Home
    },
    Profile:{
        screen:Profile
    },
    Chat:{
        screen:Chat
    },
    Channel_Profile:{
        screen:Channel_Profile
    },

})
export default createAppContainer(HomeStack);