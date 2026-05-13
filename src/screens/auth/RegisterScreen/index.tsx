import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import { register as registerUser, clearError } from '@/store/slices/authSlice';
import { registerSchema } from '@/utils/validation/authValidation';
import { colors, typography, spacing } from '@/theme';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import type { AppDispatch, RootState } from '@/store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import GradientHeader from '@/components/common/GradientHeader';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const roles = [
  { label: 'Buyer/Renter', value: 'buyer', description: 'I want to find proper properties' },
  { label: 'Seller/Owner', value: 'owner', description: 'I want to list properties' },
  { label: 'Realtor/Agent', value: 'landlord', description: 'Manage clients and listing' },
]
type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Register'
>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}
type RoleType = 'buyer' | 'seller' | 'landlord';
type StageType = 'chooseRole' | 'form' | 'otp';
type RegisterationFormProps = {
  control: any;
  handleSubmit: any;
  formState: {
    errors: any;
  };
  loading: boolean;
  onSubmit: any;
  navigation: RegisterScreenNavigationProp;
  setStage:(stage:StageType)=>void
}
type StageProcessorProps = {
  stage: StageType;
  setStage: React.Dispatch<React.SetStateAction<StageType>>;
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
const RegisterationForm = ({ control, handleSubmit, formState: { errors }, loading, onSubmit, navigation,setStage }: RegisterationFormProps) => {

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
            icon={<MaterialIcons name='person' color={colors.textSecondary} size={20}/>}
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
            icon={<MaterialIcons name='person' color={colors.textSecondary} size={20}/>}

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
            icon={<MaterialIcons name='mail' color={colors.textSecondary} size={20}/>}

          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Phone (Optional)"
            placeholder="Enter phone number"
            value={value}
            onChangeText={onChange}
            error={errors.phone?.message}
            keyboardType="phone-pad"
            icon={<MaterialIcons name='call' color={colors.textSecondary} size={20}/>}

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
            icon={<MaterialIcons name='lock' color={colors.textSecondary} size={20}/>}

          />
        )}
      />
<View style={styles.buttonContainer}>
  <Button
        onPress={()=>setStage('chooseRole')}
        loading={loading}
        style={styles.registerButton}
        variant='outline'
        textStyle={styles.buttonText}
      >
        Back
      </Button>
      <Button
        onPress={()=>setStage('otp')}
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
const RolesCardList: React.FC<{ onSelectRole: (role: any) => void, selectedRole: 'buyer' | 'seller' | 'landlord' }> = ({ onSelectRole, selectedRole }) => {
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
const StageProcessor = ({ stage, setStage }: StageProcessorProps) => {
  const stages: { id: StageType; label: string; number: number }[] = [
    { id: 'chooseRole', label: 'Choose Your Role', number: 1 },
    { id: 'form', label: 'Enter your details', number: 2 },
    { id: 'otp', label: '', number: 3 },
  ];

  const getStageIndex = (stageId: string) => stages.findIndex(s => s.id === stageId);
  const currentStageIndex = getStageIndex(stage);

  return (
    <View style={{ marginBottom: spacing.lg, flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        {stages.map((s, index) => (
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
            {index < stages.length - 1 && (
              <View
                style={[
                  styles.connectorLine,
                  currentStageIndex > index && styles.connectorLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
      <Text style={styles.stageLabel}>{stages[currentStageIndex]?.label}</Text>

    </View>
  );
};
const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const [stage, setStage] = React.useState<StageType>('chooseRole');
  const [selectedRole, setSelectedRole] = React.useState<RoleType>('buyer');
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (data: any) => {
    dispatch(clearError());
    const result = await dispatch(registerUser(data));

    if (registerUser.fulfilled.match(result)) {
      // Navigation handled by App.tsx
    } else {
      Alert.alert('Error', error || 'Registration failed');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <GradientHeader title='Create Account' subtitle='Join Company today' />
      <View style={styles.card}>
        <StageProcessor stage={stage} setStage={setStage} />
        {stage === 'chooseRole' &&
          <RoleForm selectedRole={selectedRole} setSelectedRole={setSelectedRole} setStage={setStage} loading={loading} />}


        {stage === 'form' && (
          <RegisterationForm setStage={setStage} control={control} handleSubmit={handleSubmit} formState={{ errors }} loading={loading} onSubmit={onSubmit} navigation={navigation} />
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signupText}>Login</Text>
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
    width:'50%'
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
    paddingHorizontal: spacing.sm,
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
    gap:10
  },
});

export default RegisterScreen;