import { BarCodeScanner } from 'expo-barcode-scanner';
import React from 'react'
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView } from 'react-native';
import * as Permissions from 'expo-permissions';
import firebase from 'firebase'
import db from '../config'


export default class BookTransactionScreen extends React.Component {
    constructor(){
        super();
        this.state={
            hasCameraPermissions: null,
            scanned: false,
             buttonState: 'normal',  
            scannedStudentId: '',
            scannedBookId: ''
        }
        
    }
      
    getCameraPermissions = async(id) =>{
        const {status}= await Permissions.askAsync(Permissions.CAMERA);
        this.setState({
            hasCameraPermissions: status==='granted',
            buttonState: id,
            scanned: false
        })
    }

    handleBarCodeScanned=async({type,data}) =>{
        const {buttonState}=this.state;
        if(buttonState==="BookId"){
            this.setState({
                scanned: true,
                scannedBookId: data,
                buttonState: 'normal'
            })
        }
        else if(buttonState==="studentId"){
            this.setState({
                scanned: true,
                scannedStudentId: data,
                buttonState: 'normal'
            })
        }
       
    }
    initiateBookIssue= async()=>{
        db.collection('transactions').add({
            'studentId': this.state.scannedStudentId,
            'bookId': this.state.scannedBookId,
            'date' : firebase.firestore.Timestamp.now().toDate(),
            'transactionType': "Issue"
        })
        db.collection('books').doc(this.state.scannedBookId).update({
            'bookAvailability': false
        })
        db.collection('students').doc(this.state.scannedStudentId).update({
            'noOfBooksIssued': firebase.firestore.FieldValue.increment(1)
        })
        Alert.alert("Book issued")
        this.setState({
            scannedStudentId: '',
            scannedBookId: ''
        })
    }

    initiateBookReturn= async()=>{
        db.collection('transactions').add({
            'studentId': this.state.scannedStudentId,
            'bookId': this.state.scannedBookId,
            'date' : firebase.firestore.Timestamp.now().toDate(),
            'transactionType': "Return"
        })
        db.collection('books').doc(this.state.scannedBookId).update({
            'bookAvailability': true
        })
        db.collection('students').doc(this.state.scannedStudentId).update({
            'noOfBooksIssued': firebase.firestore.FieldValue.increment(-1)
        })
   
        Alert.alert("Book returned");
        this.setState({
            scannedStudentId: '',
            scannedBookId: ''
        })
    }

    checkBookEligibility=async()=>{
        const bookRef = await db.collection("books").where("bookId","==",this.state.scannedBookId).get();
        var transactionType='';
        if(bookRef.docs.lenght===0){
            transactionType=false;
        }

        else{
            bookRef.docs.map(doc=>{
                var book=doc.data();
                if(book.bookAvailability){
                    transactionType="Issue";
                }

                else{
                    transactionType="Return";
                }
            })
        }
        return transactionType;
    }

    checkStudentEligibilityForBookIssue= async()=>{
        const studentRef = await db.collection("students").where("studentId","==",this.state.scannedStudentId).get();
        var isStudentEligible= "";
        if(studentRef.docs.lenght===0){
            this.setState({
                scannedStudentId: "",
                scannedBookId: ''
            })
            isStudentEligible =  false;
             Alert.alert(' Student ID does not exist in the database ')
        }
        else{
            studentRef.docs.map((doc)=>{
                var student  = doc.data();
                if(student.noOfBooksIssued < 2){
                    isStudentEligible= true;
                }

                else{
                    isStudentEligible= false;
                    Alert.alert("Student has already issued 2 books");
                    this.setState({
                        scannedStudentId : '',
                        scannedBookId : ''
                    })
                }
            })
        }
        return isStudentEligible;
    }

    checkStudentEligibilityForBookReturn = async()=>{
        const transactionRef = await db.collection("transactions").where("bookId","==",this.state.scannedBookId).limit(1).get();
        var isStudentEligible= "";
        transactionRef.docs.map((doc)=>{
                var lastBookTransaction  = doc.data();
                if(lastBookTransaction.studentId ===  this.state.scannedStudentId){
                    isStudentEligible= true;
                }

                else{
                    isStudentEligible= false;
                    Alert.alert("Book was not issued by this student");
                    this.setState({
                        scannedStudentId : '',
                        scannedBookId : ''
                    })
                }
            })
        
        return isStudentEligible;
    }

    handleTransaction=async()=>{
        var transactionType=await this.checkBookEligibility();

        if(!transactionType){
            Alert.alert("Book does not exist in the database");
            this.setState({
                scannedStudentId: '',
                scannedBookId: ''
            })
        }
        else if(transactionType==='Issue'){
            var isStudentEligible= await this.checkStudentEligibilityForBookIssue();

            if(isStudentEligible){
                this.initiateBookIssue();
                Alert.alert("Book issued to the student")
            }
        }
        
        else{
            var isStudentEligible= await this.checkStudentEligibilityForBookReturn();

            if(isStudentEligible){
                this.initiateBookReturn();
                Alert.alert("Book returned to the library");
            } 
        }
    }

    render(){

        const hasCameraPermissions= this.state.hasCameraPermissions;
        const scanned= this.state.scanned;
        const buttonState= this.state.buttonState;
        if(buttonState!=='normal' && hasCameraPermissions){
             return(
                 <BarCodeScanner
                 onBarCodeScanned={scanned? undefined:this.handleBarCodeScanned}
                 style={StyleSheet.absoluteFillObject}
                 />

                
             )

            
        }
     else if(buttonState==='normal'){
    return (

           <KeyboardAvoidingView style={styles.container} behavior='padding' enabled>

        
            <View>
                <Image source={require('../assets/booklogo.jpg')} style={{width: 200,height:200}}  />
                <Text style={{textAlign:'center',fontSize:20}}>Wily</Text>
            </View>
            <View style={styles.inputView}>
                <TextInput style={styles.inputBox} placeholder= 'Book Id' onChangeText={text => this.setState({scannedBookId: text})} value={this.state.scannedBookId}/>
                <TouchableOpacity style={styles.scannedButton} onPress={()=>{
                    this.getCameraPermissions("BookId");
                }}>
                    <Text style={styles.buttonText}>Scan</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.inputView}>
                <TextInput style={styles.inputBox} placeholder='Student Id' onChangeText={text => this.setState({scannedStudentId:text})} value={this.state.scannedStudentId}/>
                <TouchableOpacity style={styles.scannedButton} onPress={()=>{
                    this.getCameraPermissions("StudentId");
                }}>
                    <Text style={styles.buttonText}>Scan</Text>
                </TouchableOpacity>
            </View>

            <View>
                <TouchableOpacity style={styles.submitButton} onPress={async()=> {this.handleTransaction()}}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
            </View>
            </KeyboardAvoidingView>
        
        
    )
     }

}}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    displayText: {
        fontSize: 15,
        textDecorationLine: 'underline'
    },
    scanButton :{
        backgroundColor: "purple",
        padding: 10,
        margin:10
    
    },
    buttonText:{
        fontSize: 20,
        textAlign:'center'
    },
    inputView:{
        flexDirection: 'row',
        margin: 20
    },
    inputBox:{
        width: 200,
        height:40,
        fontSize:20
    },
    scannedButton:{
        backgroundColor: "#66BB6A",
        width:70,
        height:40,
        borderWidth: 1.5
    },
    submitButton:{
        backgroundColor: 'blue',
        height: 50,
        width: 100,
        borderRadius: 20
    },   
     submitButtonText:{
         textAlign:'center',
         fontSize:20,
         fontWeight: 'bold',
         color: 'white',
         padding:10,
        
     }
})


