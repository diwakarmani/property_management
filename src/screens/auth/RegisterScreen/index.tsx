import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useForm, Controller, FieldErrors } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import { register as registerUser, clearError, sendOtp } from '@/store/slices/authSlice';
import { agencyDetailsSchema, registerSchema } from '@/utils/validation/authValidation';
import { colors, typography, spacing } from '@/theme';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import type { AppDispatch, RootState } from '@/store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import GradientHeader from '@/components/common/GradientHeader';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import DocumentPickerInput from '@/components/common/DocumentPicker';

const roles = [
  { label: 'Buyer/Renter', value: 'buyer', description: 'I want to find proper properties' },
  { label: 'Seller/Owner', value: 'owner', description: 'I want to list properties' },
  { label: 'Realtor/Agent', value: 'group_admin', description: 'Manage clients and listing' },
]
type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Register'
>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}
type RoleType = 'buyer' | 'seller' | 'group_admin';
type StageType = 'chooseRole' | 'form' | 'otp' | 'agency_form';
type RegisterationFormProps = {
  watch: any,
  control: any;
  handleSubmit: any;
  formState: {
    errors: FieldErrors<{ phone: string | undefined; firstName: string; lastName: string; email: string; password: string; }>;
  };
  loading: boolean;
  onSubmit: any;
  navigation: RegisterScreenNavigationProp;
  setStage: (stage: StageType) => void
  role: RoleType
}
type AgencyFormProps = {
  control: any;
  handleSubmit: any;
  formState: {
    errors: FieldErrors<{ agencyName: string; licenseNumber: string; experience: number; certificationDocument: any }>;
  };
  loading: boolean;
  onSubmit: any;
  navigation: RegisterScreenNavigationProp;
  setStage: (stage: StageType) => void
}
type StageProcessorProps = {
  stage: StageType;
  selectedRole: RoleType;
}
type OTPIdentifierSelectProps = {
  role: RoleType,
  setStage: (stage: StageType) => void,
  loading: boolean,
  navigation: RegisterScreenNavigationProp
  data: {
    email: string;
    phoneNumber: string
  },
  handleSendOTP: (data: {
    identifier: string
  }) => void
}
type RoleFormProps = {
  selectedRole: RoleType;
  setSelectedRole: React.Dispatch<React.SetStateAction<RoleType>>;
  setStage: React.Dispatch<React.SetStateAction<StageType>>;
  loading: boolean;
}
const RoleForm: React.FC<RoleFormProps> = ({ selectedRole, setSelectedRole, setStage, loading }) => {
  return (
    <><Text style={styles.headerQuestionText}>How do you want to use Company?</Text>
      <RolesCardList onSelectRole={(role) => setSelectedRole(role)} selectedRole={selectedRole} />
      <Button onPress={() =>

        setStage('form')

      } style={{ marginTop: spacing.lg }} loading={loading}>
        Next
      </Button>
    </>
  )
}
const RegisterationForm = ({ watch, control, handleSubmit, formState: { errors }, loading, onSubmit, navigation, setStage, role }: RegisterationFormProps) => {

  return (

    <View style={styles.form}>
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, value } }) => (
          <Input
            label="First Name"
            placeholder="Enter first name"
            value={value}
            onChangeText={onChange}
            error={errors.firstName?.message}
            icon={<MaterialIcons name='person' color={colors.textSecondary} size={20} />}
          />
        )}
      />

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Last Name"
            placeholder="Enter last name"
            value={value}
            onChangeText={onChange}
            error={errors.lastName?.message}
            icon={<MaterialIcons name='person' color={colors.textSecondary} size={20} />}

          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Email"
            placeholder="Enter email"
            value={value}
            onChangeText={onChange}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<MaterialIcons name='mail' color={colors.textSecondary} size={20} />}

          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Phone"
            placeholder="Enter phone number"
            value={value}
            maxLength={10}
            onChangeText={onChange}
            error={errors.phone?.message}
            keyboardType="phone-pad"
            icon={<MaterialIcons name='call' color={colors.textSecondary} size={20} />}

          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Password"
            placeholder="Enter password (min 8 characters)"
            value={value}
            onChangeText={onChange}
            error={errors.password?.message}
            secureTextEntry
            icon={<MaterialIcons name='lock' color={colors.textSecondary} size={20} />}

          />
        )}
      />
      <View style={styles.buttonContainer}>
        <Button
          onPress={() => setStage('chooseRole')}
          style={styles.registerButton}
          variant='outline'
          textStyle={styles.buttonText}
        >
          Back
        </Button>
        <Button
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.registerButton}
          textStyle={styles.buttonText}

        >
          Next
        </Button>
      </View>

    </View>
  )
}
const RolesCardList: React.FC<{ onSelectRole: (role: any) => void, selectedRole: 'buyer' | 'seller' | 'group_admin' }> = ({ onSelectRole, selectedRole }) => {
  return (
    roles.map(role => (
      <TouchableOpacity key={role.value} style={styles.roleCard} onPress={() => onSelectRole(role.value)} activeOpacity={0.8}>

        <Ionicons name={selectedRole === role.value ? 'radio-button-on' : 'radio-button-off'} color={colors.linkText} size={20} />
        <View style={styles.labelContainer}>
          <Text style={styles.roleLabel}>{role.label}</Text>
          <Text style={styles.roleDescription}>{role.description}</Text>
        </View>
      </TouchableOpacity>
    ))
  );
}
const AgencyForm = ({ control, handleSubmit, formState: { errors }, loading, onSubmit, navigation, setStage }: AgencyFormProps) => {
  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Agency Name"
            placeholder="Prime Group"
            value={value}
            onChangeText={onChange}
            error={errors.agencyName?.message}
            icon={<MaterialIcons name='business-center' color={colors.textSecondary} size={20} />}
          />
        )}
      />

      <Controller
        control={control}
        name="licenseNumber"
        render={({ field: { onChange, value } }) => (
          <Input
            label="License Number"
            placeholder="Enter license number"
            value={value}
            onChangeText={onChange}
            error={errors.licenseNumber?.message}
            icon={<FontAwesome name='drivers-license-o' color={colors.textSecondary} size={20} />}

          />
        )}
      />

      <Controller
        control={control}
        name="experience"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Years of Experience"
            placeholder="Enter experience"
            value={value}
            onChangeText={onChange}
            error={errors.experience?.message}
            keyboardType='numeric'
            autoCapitalize="none"
            icon={<FontAwesome name='calendar' color={colors.textSecondary} size={20} />}

          />
        )}
      />



      <DocumentPickerInput
        label='Upload Certification'
        control={control}
        errors={errors}
      />
      <View style={styles.buttonContainer}>
        <Button
          onPress={() => setStage('chooseRole')}
          style={styles.registerButton}
          variant='outline'
          textStyle={styles.buttonText}
        >
          Back
        </Button>
        <Button
          onPress={() => setStage('otp')}
          loading={loading}
          style={styles.registerButton}
          textStyle={styles.buttonText}

        >
          Next
        </Button>
      </View>

    </View>
  );
}
const StageProcessor = ({ stage, selectedRole }: StageProcessorProps) => {
  const stages: { id: StageType; label: string; number: number }[] = [
    { id: 'chooseRole', label: 'Choose Your Role', number: 1 },
    { id: 'form', label: 'Enter your details', number: 2 },
    { id: 'otp', label: '', number: 3 },
  ];

  const agencyStages: { id: StageType; label: string; number: number }[] = [
    { id: 'chooseRole', label: 'Choose Your Role', number: 1 },
    { id: 'form', label: 'Enter your details', number: 2 },
    { id: 'agency_form', label: 'Enter Agency Details', number: 3 },
    { id: 'otp', label: '', number: 4 },
  ];

  const getStageIndex = (stageId: string) => selectedRole === 'group_admin' ? agencyStages.findIndex(s => s.id === stageId) : stages.findIndex(s => s.id === stageId);
  const currentStageIndex = getStageIndex(stage);

  return (
    <View style={{ marginBottom: spacing.lg, flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        {
          (() => {
            const renderStages = selectedRole === 'group_admin' ? agencyStages : stages;

            return renderStages.map((s, index) => (
              <View key={s.id} style={{ alignItems: 'center', flexDirection: 'row' }}>
                {/* Stage Circle */}
                <View
                  style={[
                    styles.stageCircle,
                    currentStageIndex >= index && styles.stageCircleActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stageNumber,
                      currentStageIndex >= index && styles.stageNumberActive,
                    ]}
                  >
                    {s.number}
                  </Text>
                </View>

                {/* Connector Line (between circles) */}
                {index < renderStages.length - 1 && (
                  <View
                    style={[
                      styles.connectorLine,
                      currentStageIndex > index && styles.connectorLineActive,
                    ]}
                  />
                )}
              </View>
            ));
          })()
        }

      </View>
      <Text style={styles.stageLabel}>{selectedRole === 'group_admin' ? agencyStages[currentStageIndex]?.label : stages[currentStageIndex]?.label}</Text>

    </View>
  );
};
const OTPIdentifierSelect = ({ role, setStage, loading, data, handleSendOTP }: OTPIdentifierSelectProps) => {
  const [activeOption, setActiveOption] = useState<'phone' | 'email'>('email')
  return (
    <>
      <View style={styles.otpSelectTopContainer}>
        <View style={styles.verifyIconContainer}>
          <View style={styles.verifyIconInnerContainer} >
            <MaterialIcons name='check' color={colors.white} size={20} />
          </View>
        </View>
        <Text>Verify Your Details</Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.fontSize.xs }}>Where would you like to recieve the OTP?</Text>
      </View>
      <View style={styles.otpOptionSelectContainer}>

        <TouchableOpacity style={[styles.otpOptionSelect, activeOption === 'email' && styles.otpActiveOptionSelect]} onPress={() => setActiveOption('email')}>
          <View style={[styles.verifyIconContainer, { backgroundColor: colors.lightGray, borderColor: colors.darkGray, borderWidth: 1 }]}><MaterialIcons name='email' color={colors.darkGray} size={20} /></View>
          <Text>On your registered email address</Text>
          <View><MaterialIcons name='chevron-right' color={colors.darkGray} size={20} /></View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.otpOptionSelect, activeOption === 'phone' && styles.otpActiveOptionSelect]} onPress={() => setActiveOption('phone')}>
          <View style={[styles.verifyIconContainer, { backgroundColor: colors.lightGray, borderColor: colors.darkGray, borderWidth: 1 }]}><MaterialIcons name='call' color={colors.darkGray} size={20} /></View>
          <Text>On your registered phone number</Text>
          <View><MaterialIcons name='chevron-right' color={colors.darkGray} size={20} /></View>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          onPress={() => role === 'group_admin' ? setStage('agency_form') : setStage('form')}
          style={styles.registerButton}
          variant='outline'
          textStyle={styles.buttonText}
        >
          Back
        </Button>
        <Button style={styles.registerButton} loading={loading} onPress={() => handleSendOTP({ identifier: activeOption === 'phone' ? data.phoneNumber : data.email })}>
          Verify
        </Button>
      </View>
    </>
  )
}
const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const [stage, setStage] = React.useState<StageType>('chooseRole');
  const [selectedRole, setSelectedRole] = React.useState<RoleType>('buyer');
  // First form
  const {
    control: registerControl,
    watch,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm({
    resolver: yupResolver(registerSchema),
  });

  // Second form
  const {
    control: agencyControl,
    handleSubmit: handleAgencySubmit,
    formState: { errors: agencyErrors },
  } = useForm({
    resolver: yupResolver(agencyDetailsSchema),
  });

  const onSubmit = async (data: any) => {
    dispatch(clearError());
    const result = await dispatch(registerUser(data));

    if (registerUser.fulfilled.match(result)) {
      selectedRole==='group_admin'?setStage('agency_form'):setStage('otp')
    } else {
      const errorMessage =
        (result.payload as string) || // if rejectWithValue(...) was used
        result.error?.message ||      // default Redux Toolkit error
        'Registration failed';

      console.log('error', errorMessage);
      Alert.alert('Error', errorMessage);
    }
  };
  const handleSendOTP = async (data: { identifier: string }) => {
    const result = await dispatch(sendOtp({ identifier: data.identifier }));
    if (sendOtp.fulfilled.match(result)) {
      navigation.navigate('OTPVerification', { identifier: data.identifier });
    } else {
      Alert.alert('Error', error || 'Failed to send OTP');
    }
  }
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <GradientHeader title='Create Account' subtitle='Join Company today' />
      <View style={styles.card}>
        <StageProcessor stage={stage} selectedRole={selectedRole} />
        {stage === 'chooseRole' &&
          <RoleForm selectedRole={selectedRole} setSelectedRole={setSelectedRole} setStage={setStage} loading={loading} />}


        {stage === 'form' && (
          <RegisterationForm watch={watch} setStage={setStage} control={registerControl} handleSubmit={handleRegisterSubmit} formState={{ errors: registerErrors }} loading={loading} onSubmit={onSubmit} navigation={navigation} role={selectedRole} />
        )}
        {selectedRole === 'group_admin' && stage === 'agency_form' && <AgencyForm setStage={setStage} control={agencyControl} handleSubmit={handleAgencySubmit} formState={{ errors: agencyErrors }} loading={loading} onSubmit={onSubmit} navigation={navigation} />}
        {stage == 'otp' && <OTPIdentifierSelect role={selectedRole} setStage={setStage} loading={loading} handleSendOTP={handleSendOTP} navigation={navigation} data={{ email: watch('email'), phoneNumber: watch('phone') }} />}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signupText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 0,
  },
  header: {
    marginTop: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  form: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,

  },
  registerButton: {
    marginTop: spacing.lg,
    width: '50%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  loginText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: spacing.xl,
  },


  stageCircle: {
    width: 28,
    height: 28,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  stageCircleActive: {
    backgroundColor: '#2563EB', // Blue
    borderColor: '#2563EB',
  },
  stageNumber: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: '#666',
  },
  stageNumberActive: {
    color: '#FFF',
  },

  connectorLine: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
  },
  connectorLineActive: {
    backgroundColor: '#2563EB',
  },
  stageLabel: {
    color: colors.textSecondary,
  },
  headerQuestionText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  buttonText: {
    fontSize: typography.fontSize.md,
  },
  roleCard: {
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginVertical: spacing.md,
    backgroundColor: colors.lightGray,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center'
  },
  labelContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  roleLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  roleDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  signupText: {
    fontSize: typography.fontSize.sm,
    color: colors.linkText,
    fontWeight: typography.fontWeight.bold,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    justifyContent: 'space-between',
    gap: 10
  },
  otpSelectTopContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4
  },
  verifyIconContainer:
  {
    backgroundColor: colors.successLight,
    borderRadius: 50, height: 50, width: 50, justifyContent: 'center', alignItems: 'center'
  },
  verifyIconInnerContainer: {
    backgroundColor: colors.success, borderRadius: 50, width: 25, height: 25, justifyContent: 'center', alignItems: 'center'
  },
  otpOptionSelect: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 5,
    alignItems: 'center',
    gap: 5,
  },
  otpOptionSelectContainer: {
    gap: 20,
    marginTop: 50,
    marginBottom: 20
  },
  otpActiveOptionSelect: {
    backgroundColor: colors.linkLight,
    borderColor: colors.linkText
  }
});

export default RegisterScreen;