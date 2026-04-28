import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme';


import LoginScreen          from '../screens/auth/LoginScreen';
import AdminHomeScreen      from '../screens/AdminHomeScreen';
import InstructorHomeScreen     from '../screens/InstructorHomeScreen';
import InstructorDashboardScreen from '../screens/instructor/InstructorDashboardScreen';
import InstructorNotificationsScreen from '../screens/instructor/InstructorNotificationsScreen';
import InstructorExamsScreen     from '../screens/instructor/InstructorExamsScreen';
import InstructorExamDetailsScreen from '../screens/instructor/InstructorExamDetailsScreen';
import LearningScreen       from '../screens/learning/LearningScreen';
import QuizScreen           from '../screens/learning/QuizScreen';
import PaymentsScreen       from '../screens/payments/PaymentsScreen';
import AddPaymentScreen     from '../screens/payments/AddPaymentScreen';
import AccountScreen        from '../screens/AccountScreen';
import StudentHomeScreen    from '../screens/StudentHomeScreen';
import SessionsScreen       from '../screens/sessions/SessionsScreen';
import BookSessionScreen    from '../screens/sessions/BookSessionScreen';

import StudentListScreen     from '../screens/admin/StudentListScreen';
import InstructorListScreen from '../screens/admin/InstructorListScreen';
import AddEditStudentScreen  from '../screens/admin/AddEditStudentScreen';
import MonthlyReportScreen   from '../screens/admin/MonthlyReportScreen';
import StudentDashboard      from '../screens/student/StudentDashboardScreen';
import StudentLearningScreen   from '../screens/student/learning/StudentLearningScreen';
import StudentExamsScreen     from '../screens/student/StudentExamsScreen';
import StudentExamDetailsScreen from '../screens/student/StudentExamDetailsScreen';
import AddEditInstructorScreen from '../screens/admin/AddEditInstructorScreen';
import VehicleListScreen       from '../screens/admin/VehicleListScreen';
import VehicleDetailScreen     from '../screens/admin/VehicleDetailScreen';
import AddEditVehicleScreen   from '../screens/admin/AddEditVehicleScreen';
import AddEditOwnerScreen     from '../screens/admin/AddEditOwnerScreen';
import OwnersListScreen       from '../screens/admin/OwnersListScreen';
import VehicleUsageReportScreen from '../screens/admin/VehicleUsageReportScreen';
import ExpiryAlertsScreen    from '../screens/admin/ExpiryAlertsScreen';

// Exam System Imports
import ExamDashboardScreen      from '../screens/admin/exam/ExamDashboardScreen';
import TheoryExamListScreen     from '../screens/admin/exam/TheoryExamListScreen';
import PracticalExamListScreen  from '../screens/admin/exam/PracticalExamListScreen';
import ExamDetailsScreen        from '../screens/admin/exam/ExamDetailsScreen';
import ProgressTrackingScreen   from '../screens/admin/exam/ProgressTrackingScreen';
import CreateTheoryExamScreen   from '../screens/admin/exam/CreateTheoryExamScreen';
import CreatePracticalExamScreen from '../screens/admin/exam/CreatePracticalExamScreen';
import CreateExamScreen         from '../screens/admin/exam/CreateExamScreen';
import EditTheoryExamScreen     from '../screens/admin/exam/EditTheoryExamScreen';
import EditPracticalExamScreen  from '../screens/admin/exam/EditPracticalExamScreen';

import AdminSessionListScreen from '../screens/admin/AdminSessionListScreen';
import AddEditSessionScreen   from '../screens/admin/AddEditSessionScreen';
import SessionReportScreen    from '../screens/admin/SessionReportScreen';
import FeedbackScreen         from '../screens/student/FeedbackScreen';
import FeedbackManagementScreen from '../screens/admin/FeedbackManagementScreen';
import LicenseCategoriesScreen from '../screens/admin/LicenseCategoriesScreen';
import VehicleClassesScreen from '../screens/admin/VehicleClassesScreen';
import EnrollmentManagementScreen from '../screens/admin/EnrollmentManagementScreen';
import AttendanceManagementScreen from '../screens/admin/AttendanceManagementScreen';

import SessionEnrollmentScreen   from '../screens/admin/SessionEnrollmentScreen';
import TakeAttendanceScreen      from '../screens/admin/TakeAttendanceScreen';
import AttendanceAnalyticsScreen from '../screens/admin/AttendanceAnalyticsScreen';
import StudentProgressScreen     from '../screens/admin/StudentProgressScreen';
import AvailableSessionsScreen   from '../screens/student/AvailableSessionsScreen';
import MarkAttendanceScreen     from '../screens/student/MarkAttendanceScreen';
import ConfirmAttendanceScreen  from '../screens/instructor/ConfirmAttendanceScreen';

import LearningCatalogScreen from '../screens/student/learning/LearningCatalogScreen';
import LessonDetailScreen from '../screens/student/learning/LessonDetailScreen';
import ResourceDetailScreen from '../screens/student/learning/ResourceDetailScreen';
import LessonScreen          from '../screens/student/learning/LessonScreen';
import QuizTakeScreen        from '../screens/student/learning/QuizTakeScreen';
import QuizResultScreen      from '../screens/student/learning/QuizResultScreen';

import AdminTopicsScreen        from '../screens/admin/learning/AdminTopicsScreen';
import AdminLessonsScreen       from '../screens/admin/learning/AdminLessonsScreen';
import AdminLessonDetailScreen  from '../screens/admin/learning/AdminLessonDetailScreen';
import AdminQuizBuilderScreen   from '../screens/admin/learning/AdminQuizBuilderScreen';
import AdminQuizAnalyticsScreen from '../screens/admin/learning/AdminQuizAnalyticsScreen';
import CreateLearningContentScreen from '../screens/admin/learning/CreateLearningContentScreen';
import AdminVideoUploadScreen   from '../screens/admin/learning/AdminVideoUploadScreen';
import AdminLessonVideosScreen  from '../screens/admin/learning/AdminLessonVideosScreen';
import AdminQuizLessonsScreen   from '../screens/admin/learning/AdminQuizLessonsScreen';
import AdminLessonQuizzesScreen from '../screens/admin/learning/AdminLessonQuizzesScreen';
import AdminStudyMaterialScreen from '../screens/admin/learning/AdminStudyMaterialScreen';

// Staff Management Imports
import StaffListScreen from '../screens/admin/staff/StaffListScreen';
import CreateStaffScreen from '../screens/admin/staff/CreateStaffScreen';
import EditStaffScreen from '../screens/admin/staff/EditStaffScreen';
import StaffAttendanceScreen from '../screens/admin/staff/StaffAttendanceScreen';
import StaffPerformanceScreen from '../screens/admin/staff/StaffPerformanceScreen';
import StaffLoginScreen from '../screens/staff/StaffLoginScreen';
import StaffHomeScreen from '../screens/staff/StaffHomeScreen';
import StaffNotificationsScreen from '../screens/staff/StaffNotificationsScreen';
import StudentNotificationsScreen from '../screens/student/StudentNotificationsScreen';
import StudentInquiryScreen from '../screens/student/StudentInquiryScreen';
import InquiryManagementScreen from '../screens/admin/InquiryManagementScreen';
import SendNoticeScreen from '../screens/admin/SendNoticeScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabBar({ icons, iconsActive, state, navigation, insets }) {
  const bottomPad = Math.max(insets?.bottom ?? 0, 12);
  return (
    <View style={[styles.tabBar, { paddingBottom: bottomPad }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => { if (!isFocused) navigation.navigate(route.name); }}
            activeOpacity={0.75}
          >
            <View style={[styles.iconBubble, isFocused && styles.iconBubbleActive]}>
              <Ionicons
                name={isFocused ? iconsActive[index] : icons[index]}
                size={21}
                color={isFocused ? COLORS.white : COLORS.darkGray}
              />
            </View>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar icons={['home-outline','people-outline','calendar-outline','person-outline']} iconsActive={['home','people','calendar','person']} {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"     component={AdminHomeScreen} />
      <Tab.Screen name="Students" component={StudentListScreen} />
      <Tab.Screen name="Sessions" component={AdminSessionListScreen} />
      <Tab.Screen name="Account"  component={AccountScreen} />
    </Tab.Navigator>
  );
}

function StudentTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar icons={['home-outline','school-outline','card-outline','person-outline']} iconsActive={['home','school','card','person']} {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"     component={StudentHomeScreen} />
      <Tab.Screen name="Learning" component={StudentLearningScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Account"  component={AccountScreen} />
    </Tab.Navigator>
  );
}

function InstructorTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar icons={['home-outline','calendar-outline','person-outline']} iconsActive={['home','calendar','person']} {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"     component={InstructorHomeScreen} />
      <Tab.Screen name="Sessions" component={SessionsScreen} />
      <Tab.Screen name="Account"  component={AccountScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  if (user.role === 'admin') {
    return (
      <Stack.Navigator screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationTypeForReplace: 'push',
      }}>
        <Stack.Screen name="AdminMain"         component={AdminTabs} />
        <Stack.Screen name="StudentList"       component={StudentListScreen} />
        <Stack.Screen name="AddStudent"        component={AddEditStudentScreen} />
        <Stack.Screen name="EditStudent"       component={AddEditStudentScreen} />
        <Stack.Screen name="StudentDetail"     component={StudentDashboard} />
        <Stack.Screen name="MonthlyReport"     component={MonthlyReportScreen} />
        <Stack.Screen name="InstructorList"    component={InstructorListScreen} />
        <Stack.Screen name="AddEditInstructor" component={AddEditInstructorScreen} />
        <Stack.Screen name="InstructorDetail"  component={AddEditInstructorScreen} />
        <Stack.Screen name="VehicleList"       component={VehicleListScreen} />
        <Stack.Screen name="VehicleDetail"      component={VehicleDetailScreen} />
        <Stack.Screen name="AddEditVehicle"    component={AddEditVehicleScreen} />
        <Stack.Screen name="AddEditOwner"      component={AddEditOwnerScreen} />
        <Stack.Screen name="OwnersList"        component={OwnersListScreen} />
        <Stack.Screen name="VehicleUsageReport" component={VehicleUsageReportScreen} />
        <Stack.Screen name="ExpiryAlerts"      component={ExpiryAlertsScreen} />
        <Stack.Screen name="AdminSessions"     component={AdminSessionListScreen} />
        <Stack.Screen name="AddEditSession"    component={AddEditSessionScreen} />
        <Stack.Screen name="SessionDetail"     component={AddEditSessionScreen} />
        <Stack.Screen name="SessionReport"     component={SessionReportScreen} />
        <Stack.Screen name="Feedback"          component={FeedbackScreen} />
        <Stack.Screen name="FeedbackManagement" component={FeedbackManagementScreen} />
        <Stack.Screen name="LicenseCategories" component={LicenseCategoriesScreen} />
        <Stack.Screen name="VehicleClasses" component={VehicleClassesScreen} />
        <Stack.Screen name="EnrollmentManagement" component={EnrollmentManagementScreen} />
        <Stack.Screen name="AttendanceManagement" component={AttendanceManagementScreen} />
        <Stack.Screen name="SessionEnrollment"     component={SessionEnrollmentScreen} />
        <Stack.Screen name="TakeAttendance"        component={TakeAttendanceScreen} />
        <Stack.Screen name="AttendanceAnalytics"   component={AttendanceAnalyticsScreen} />
        <Stack.Screen name="StudentProgress"       component={StudentProgressScreen} />
        <Stack.Screen name="AdminTopics"           component={AdminTopicsScreen} />
        <Stack.Screen name="AdminLessons"          component={AdminLessonsScreen} />
        <Stack.Screen name="AdminLessonDetail"     component={AdminLessonDetailScreen} />
        <Stack.Screen name="AdminQuizBuilder"      component={AdminQuizBuilderScreen} />
        <Stack.Screen name="AdminQuizAnalytics"    component={AdminQuizAnalyticsScreen} />
        <Stack.Screen name="CreateLearningContent" component={CreateLearningContentScreen} />
        <Stack.Screen name="AdminVideoUpload"      component={AdminVideoUploadScreen} />
        <Stack.Screen name="AdminLessonVideos"     component={AdminLessonVideosScreen} />
        <Stack.Screen name="AdminQuizLessons"      component={AdminQuizLessonsScreen} />
        <Stack.Screen name="AdminLessonQuizzes"    component={AdminLessonQuizzesScreen} />
        <Stack.Screen name="AdminStudyMaterial"    component={AdminStudyMaterialScreen} />
        
        {/* Exam System Routes */}
        <Stack.Screen name="ExamDashboard"      component={ExamDashboardScreen} />
        <Stack.Screen name="TheoryExamList"     component={TheoryExamListScreen} />
        <Stack.Screen name="PracticalExamList"  component={PracticalExamListScreen} />
        <Stack.Screen name="ExamDetails"        component={ExamDetailsScreen} />
        <Stack.Screen name="ProgressTracking"   component={ProgressTrackingScreen} />
        <Stack.Screen name="CreateTheoryExam"    component={CreateTheoryExamScreen} />
        <Stack.Screen name="CreatePracticalExam" component={CreatePracticalExamScreen} />
        <Stack.Screen name="CreateExam"         component={CreateExamScreen} />
        <Stack.Screen name="EditTheoryExam"     component={EditTheoryExamScreen} />
        <Stack.Screen name="EditPracticalExam"  component={EditPracticalExamScreen} />
        
        {/* Staff Management Routes */}
        <Stack.Screen name="StaffList"         component={StaffListScreen} />
        <Stack.Screen name="CreateStaff"       component={CreateStaffScreen} />
        <Stack.Screen name="EditStaff"         component={EditStaffScreen} />
        <Stack.Screen name="StaffAttendance"   component={StaffAttendanceScreen} />
        <Stack.Screen name="StaffPerformance"   component={StaffPerformanceScreen} />
        <Stack.Screen name="InquiryManagement" component={InquiryManagementScreen} />
        <Stack.Screen name="SendNotice"        component={SendNoticeScreen} />
        <Stack.Screen name="Payments"          component={PaymentsScreen} />
        <Stack.Screen name="AddPayment"        component={AddPaymentScreen} />
      </Stack.Navigator>
    );
  }

  if (user.role === 'student') {
    return (
      <Stack.Navigator screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationTypeForReplace: 'push',
      }}>
        <Stack.Screen name="StudentMain" component={StudentTabs} />
        <Stack.Screen name="Quiz"        component={QuizScreen} />
        <Stack.Screen name="LessonDetail"        component={LessonDetailScreen} />
        <Stack.Screen name="ResourceDetail"      component={ResourceDetailScreen} />
        <Stack.Screen name="Lesson"              component={LessonScreen} />
        <Stack.Screen name="LearningQuizTake"    component={QuizTakeScreen} />
        <Stack.Screen name="LearningQuizResult"  component={QuizResultScreen} />
        <Stack.Screen name="Feedback"    component={FeedbackScreen} />
        <Stack.Screen name="AddPayment"  component={AddPaymentScreen} />
        <Stack.Screen name="BookSession" component={BookSessionScreen} />
        <Stack.Screen name="AvailableSessions" component={AvailableSessionsScreen} />
        <Stack.Screen name="MarkAttendance" component={MarkAttendanceScreen} />
        <Stack.Screen name="LearningCatalog" component={LearningCatalogScreen} />
        <Stack.Screen name="StudentExams" component={StudentExamsScreen} />
        <Stack.Screen name="StudentExamDetails" component={StudentExamDetailsScreen} />
        <Stack.Screen name="StudentNotifications" component={StudentNotificationsScreen} />
        <Stack.Screen name="StudentInquiry" component={StudentInquiryScreen} />
      </Stack.Navigator>
    );
  }

  if (user.role === 'instructor') {
    return (
      <Stack.Navigator screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationTypeForReplace: 'push',
      }}>
        <Stack.Screen name="InstructorMain"          component={InstructorTabs} />
        <Stack.Screen name="InstructorNotifications" component={InstructorNotificationsScreen} />
        <Stack.Screen name="InstructorExams"         component={InstructorExamsScreen} />
        <Stack.Screen name="InstructorExamDetails"   component={InstructorExamDetailsScreen} />
        <Stack.Screen name="ConfirmAttendance"       component={ConfirmAttendanceScreen} />
      </Stack.Navigator>
    );
  }

  if (user.role === 'staff') {
    return (
      <Stack.Navigator screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationTypeForReplace: 'push',
      }}>
        <Stack.Screen name="StaffMain" component={StaffHomeScreen} />
        <Stack.Screen name="StaffNotifications" component={StaffNotificationsScreen} />
        <Stack.Screen name="StaffAttendance" component={StaffAttendanceScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="StaffLogin" component={StaffLoginScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection:        'row',
    backgroundColor:      COLORS.white,
    paddingTop:           10,
    paddingHorizontal:    8,
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    shadowColor:          '#000',
    shadowOffset:         { width: 0, height: -4 },
    shadowOpacity:        0.08,
    shadowRadius:         12,
    elevation:            14,
  },
  tabItem:         { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 4 },
  iconBubble:      { width: 46, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconBubbleActive:{ backgroundColor: COLORS.brandOrange },
  tabLabel:        { fontSize: 10, fontWeight: '500', color: COLORS.darkGray },
  tabLabelActive:  { fontSize: 10, fontWeight: '700', color: COLORS.brandOrange },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
