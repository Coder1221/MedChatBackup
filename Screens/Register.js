import React, { useState } from 'react'
import {View, Text, Button, StyleSheet, Image, ImageBackground, ScrollView} from 'react-native'
import { TextInput } from 'react-native-gesture-handler';
import ImagePicker from 'react-native-image-picker';
import CheckBox from '@react-native-community/checkbox';
import MultiSelect from 'react-native-multiple-select';

import { Circle } from 'react-native-progress'; // https://www.npmjs.com/package/react-native-progress

import { storage } from './Utils/firebase_auth'
import diseaseList from './Utils/INITIALIZE_DISEASES.js'
import { set } from 'react-native-reanimated';

function Register({ navigation }){
    // String array ==> fName, lName, uName, password, phone, email, bday --> 
    const [profile, setProfile] = useState(['','','','','','','',])
    // Updates the checkboxes of UserType ==> Doctor or patient
    const [userType, setUserType] = useState([false,false]) 
    // A list for selected diseases (index numbers of diseases)
    const [selectedDiseases, setSelectedDiseases] = useState('')    
    // Component to show selected diseases on the screen --> docs suggested to make it
    const [multiSelect, setMultiSelect] = useState('')
    const [pic, setPic] = useState(false) // picture val
    const [progress, setProgress] = useState(0) // Progress for image upload
    const [imageUploading, setImageUploading] = useState(false) // boolean to diable the button
    // boolean array ==> fName, lName, uName, password, phone, email, bday, isDoctor, isPatient, isNeither
    const [validStates, setValidStates] = useState([1,1,1,1,1,1,1])
    // This becomes tru when all required elements are true 
    const [validAll, setValidAll] = useState(false)

    // Doctor or Patient
    function SelectUserType(entryNumber){
        let prevUserType = userType.slice()
        for(let i=0; i<prevUserType.length; i++){
            if(i==entryNumber)
                prevUserType[i] = !prevUserType[i]
            else
                prevUserType[i] = false
        }
        setUserType(prevUserType)
    }

    // validates all inputs before sending to Server
    async function ValidateAndSend(){
        // Assuming all things are correct, will change these values, if some check fails
        setValidAll(true)
        let inputChecks = true;

        // Check Validity of all inputs. Client-side checks for input
        const validate = profile.map((_, index) => {
            return validateInput(profile[index], index)
        })
        
        console.log(validate)
        validate.forEach((val,index) => {
            if(!val){
                console.log("this is not correct", val, index)
                setValidAll(false)
                inputChecks = false;
            }
        })
        console.log("inputChecks: ", inputChecks)
        let doctorDiseases = []
        let patientDisease = []

        let diseases = selectedDiseases.map(val => {
            return diseaseList[val].name
        })
        console.log(diseases)
        if(userType[0]) //Doctor
            doctorDiseases = diseases
        else if (userType[1])
            patientDisease = diseases

        
        // if all of the conditions are fulfilled we can send the packet to the server
        if(inputChecks){
            // call the api here...?
            // Sending the channel numbers (Diesease id. Not the disease)
            
            let packet = {
                "firstName" : profile[0],
                "lastName" : profile[1],
                "username" : profile[2],
                "password" : profile[3],
                "phoneNumber" : profile[4],
                "email" : profile[5],
                "birthday" : profile[6],
                "profilePicture" : pic,
                "diseaseHistory" : {
                    "isDoctor" : userType[0],
                    "isPatient" : userType[1],
                    "doctorDiseases" : doctorDiseases,
                    "patientDisease" : patientDisease
                }
            }
            console.log("packet ready for sending", packet)
            const response = await fetch('https://medchatse.herokuapp.com/signUp', {
                method: 'POST',
                headers:{
                    Accept : 'application/json',
                    'Content-type' : 'application/json',
                },
                body: JSON.stringify(packet)
            })
            const respJson = await response.json()
            console.log("JSON returned: ", respJson)
    
            try{
                alert(respJson.message)
                if(respJson.message == "Registration Successful!")
                    navigation.pop() // will move back to Login Screen after a succesful Registration
            }catch(err){
                alert(err)
            }
        }
        
    }
    // Checks the input at client side before sending it to the server
    function validateInput(text, type){
        let prevValidArr = validStates.slice()
        let prevProfileArr = profile.slice()
                
        // fName
        if(type == 0){
            const check = /[a-zA-Z]+$/ // contains only letters 
            prevProfileArr[0] = text
            prevValidArr[0] = check.test(text)
        }
        // lName
        else if(type == 1){
            const check = /[a-zA-Z]+$/  // contains only letters
            prevProfileArr[1] = text
            prevValidArr[1] = check.test(text)
        }
        // 'userName'
        else if(type == 2){
            const check = /^[a-zA-Z]\w*$/
            prevProfileArr[2] = text
            prevValidArr[2] = check.test(text)
        }
        // 'password'
        else if(type== 3){
            const check = /.{5,}/   // must be atleast 5 chars long
            prevProfileArr[3] = text
            prevValidArr[3] = check.test(text)
        }

        // 'phoneNumber' for now +92[PakistaniNumbers]
        else if(type== 4){
            const check = /\+92[0-9]{10}$/
            prevProfileArr[4] = text
            prevValidArr[4] = check.test(text)
        }
        
        // 'email'
        else if(type==5){
            // Taken from internet covers valid email styles
            const check = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/
            prevProfileArr[5] = text
            prevValidArr[5] = check.test(text)
        }

        // 'bday'
        else if(type== 6){
            const check = /^\d{4}(\-)(((0)[0-9])|((1)[0-2]))(\-)([0-2][0-9]|(3)[0-1])$/
            prevProfileArr[6] = text
            prevValidArr[6] = check.test(text)
        }

        setProfile(prevProfileArr)
        setValidStates(prevValidArr)
        return prevValidArr[type]
    }

    // https://github.com/aaronksaunders/expo-rn-firebase-image-upload
    async function UploadImage(){
        if(!pic)
            return;
        
        let image = pic;
        fetch(image.uri)
            .then(response => response.blob())
            .then( blob => {
                let imgName = new Date().getTime() + "-media.jpg"
                console.log(imgName)
                const ref = storage.ref(`images/${imgName}`)
                const uploadTask = ref.put(blob)
                uploadTask.on('state_changed',
                    snapshot => {
                        let latest_progress = snapshot.bytesTransferred / snapshot.totalBytes
                        console.log('Upload is ' + Math.round(latest_progress*100) + ' % done');
                        setProgress(latest_progress)
                        setImageUploading(true)
                    }, error =>{
                        setProgress(0)
                        setImageUploading(false)
                        alert(error)
                        console.log(error)
                    }, () => {
                        setImageUploading(false)
                        storage.ref('images').child(imgName).getDownloadURL().then(url=>{
                            console.log("File Available at: ", url);
                            setPic(prevPic => {
                                return {...prevPic, url: url}
                            })
                    })
                })
            })
    }
    function SelectImage() {
        // An options obj need to be passed to the img lib.
        const options = {
            noData : true,
        }
        ImagePicker.launchImageLibrary(options, image => {
            // console.log('Response: ', response)
            if(image.uri){
                setPic(image)
            }
            else if (image.error){
                alert(image.error)
            }
        })
    }

    // const { selectedItems } = this.state;
    return(
        <View>
            <ScrollView>
            <ImageBackground source={require('../imgs/login_background.jpeg')} style={styles.image}>
                    <Text style={{color:"#8155BA", fontSize:20, fontStyle:'normal'}}>Welcome to MedChat </Text>
                    <View style={{ justifyContent: 'center', alignItems: 'center'}}>
                        {imageUploading?
                            <Circle 
                                size={100} 
                                progress={progress}
                                showsText={true}
                                color={'8155BA'}
                            />
                            :
                            <Image
                                style={{width:100, height:100, borderRadius:100, resizeMode:'cover'}} 
                                source={pic? {uri : pic.uri} : require('../imgs/empty_profile.png')}
                            />
                            
                        }
                        
                        
                        <View style={styles.buttonView}>
                            <Button
                                color= '#8155BA'
                                onPress={()=>SelectImage()}
                                title={imageUploading? 'Uploading Image...': 'Select Image'}
                                disabled={imageUploading}
                            />
                        </View>
                    </View>
                    <TextInput
                        placeholder='First Name (letters only)'
                        value={profile[0]} 
                        onChangeText={(text)=> validateInput(text, 0)}
                        style={validStates[0]?styles.inputBox:styles.error}
                    />
                    <TextInput
                        placeholder='Last Name (letters only)'
                        value={profile[1]}
                        onChangeText={(text)=> validateInput(text, 1)}
                        style={validStates[1]?styles.inputBox:styles.error}
                    />
                    <TextInput 
                        placeholder='User Name (start with a letter, can contain alphanumeric afterwards)' 
                        value={profile[2]}
                        onChangeText={(text)=> validateInput(text, 2)}
                        style={validStates[2]?styles.inputBox:styles.error}
                    />
                    <TextInput 
                        placeholder='Password (Atleast 5 digits long)' 
                        secureTextEntry={true} 
                        value={profile[3]}
                        onChangeText={(text)=> validateInput(text, 3)}
                        style={validStates[3]?styles.inputBox:styles.error}
                    />
                    <TextInput 
                        placeholder='Phone Number (+92[10 more digits])' 
                        value={profile[4]}
                        onChangeText={(text)=> validateInput(text, 4)}
                        style={validStates[4]?styles.inputBox:styles.error}
                    />
                    <TextInput 
                        placeholder='* Email * (Optional)'
                        value={profile[5]}
                        onChangeText={(text)=> validateInput(text, 5)}
                        style={validStates[5]?styles.inputBox:styles.error}
                    />
                    <TextInput 
                        placeholder='Birth Day (yyyy-mm-dd)'
                        value={profile[6]}
                        onChangeText={(text)=> validateInput(text, 6)}
                        style={validStates[6]?styles.inputBox:styles.error}
                    />
                    
                    <Text style={{color:"#8155BA",textAlign:'left'}}>   Join the community as:</Text>
                    <View style={{ flexDirection: 'row',marginLeft:10,marginBottom:10}}>
                        <CheckBox checkedColor='red' value={userType[0]} onChange={() => SelectUserType(0)} />
                        <Text style={{marginTop: 5,color:"#8155BA",marginRight:70}}>Doctor</Text>
                        <CheckBox value={userType[1]} onChange={() => SelectUserType(1)} />
                        <Text style={{marginTop: 5,color:"#8155BA"}}>Patient</Text>
                    </View>

                    {/* <View style={{ flex: 1 }}>
                        <MultiSelect
                        hideTags
                        hideDropdown
                        items={diseaseList}
                        uniqueKey="id"
                        ref={(component) =>  setMultiSelect(component)}
                        onSelectedItemsChange={ items =>  setSelectedDiseases(items)}
                        selectedItems={selectedDiseases}
                        selectText="Diesease channels you want to join"
                        searchInputPlaceholderText="Search for a disease"
                        onChangeInput={ (text)=> console.log(text)}
                        altFontFamily="ProximaNova-Light"
                        tagRemoveIconColor="#8155BA"
                        tagBorderColor="#8155BA"
                        tagTextColor="#8155BA"
                        textColor="#8155BA"
                        selectedItemTextColor="#CCC"
                        selectedItemIconColor="#CCC"
                        itemTextColor="#000"
                        displayKey="name"
                        searchInputStyle={{ color: "#8155BA" }}
                        styleListContainer = {{backgroundColor: "#FCF4E4" }}
                        styleDropdownMenuSubsection = {{backgroundColor: "#100F4E4"}}
                        searchInputStyle = {{backgroundColor: "#100F4E4"}}
                        itemTextColor = "#8155BA"
                        submitButtonColor="#8155BA"
                        submitButtonText="Submit"
                        /> 
                        <View>
                            {selectedDiseases? multiSelect.getSelectedItemsExt(selectedDiseases): null}
                        </View>
                    </View>*/}
                    <View style={{justifyContent: 'center', alignItems: 'center'}}>
                        <View style={styles.buttonView}>
                            <Button  
                                title='Register'
                                color= '#8155BA'
                                onPress={()=> ValidateAndSend()}
                                // disabled={!validAll}
                            />
                            <Button  
                                title='Back'
                                color= '#8155BA'
                                onPress={()=> console.log("PressedBack!")}
                                disabled={!validAll}
                            />
                        </View>
                    </View>
                </ImageBackground>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    image: {
        flex: 1,
        resizeMode: "cover",
        justifyContent: "center",
        // alignSelf: 'stretch',
        // width: null,
      },
    inputBox: {
        marginTop:10,
        borderBottomWidth:1,
        borderBottomColor:'#A49393',
    },
    error: {
        marginTop:10,
        borderBottomWidth:1,
        borderColor: 'red',
    },
    buttonView: {
        borderRadius: 50,
        overflow:'hidden',
        width:'50%',
        marginBottom:5,
        marginTop: 10
    }
})

export default Register;