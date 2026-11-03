/** Display-only OAuth copy; provider ids and server account identities never translated. */
export const SOCIAL_KEYS=Object.freeze([
 'gate.socialDivider','gate.google','gate.apple','gate.socialHelp',
 'auth.socialUnavailable','auth.socialInvalid','auth.socialFailed','auth.socialSuccess'
]);
const translations={
 'tr':['veya','Google ile devam et','Apple ile devam et',
  'Oyun ilerlemen hesap kimliğine bağlıdır. Farklı giriş yöntemi ayrı bir hesap oluşturabilir.',
  'Bu giriş yöntemi henüz etkin değil. E-posta ile giriş yapabilir veya daha sonra deneyebilirsin.',
  'Güvenli giriş bağlantısı geçersiz veya süresi dolmuş. Yeniden dene.',
  'Sosyal giriş tamamlanamadı. Lütfen yeniden dene.','Hesabın doğrulandı. Krallığın yükleniyor.'],
 'en':['or','Continue with Google','Continue with Apple',
  'Progress belongs to your account identity. A different sign-in method may create a separate account.',
  'This sign-in method is not enabled yet. Use email sign-in or try again later.',
  'The secure sign-in link is invalid or expired. Please try again.',
  'Social sign-in could not be completed. Please try again.','Account verified. Loading your kingdom.'],
 'es':['o','Continuar con Google','Continuar con Apple',
  'El progreso pertenece a tu cuenta. Otro método de acceso puede crear una cuenta distinta.',
  'Este método aún no está activado. Usa tu correo o vuelve más tarde.',
  'El enlace de acceso seguro no es válido o ha caducado. Inténtalo otra vez.',
  'No se pudo completar el inicio de sesión. Inténtalo de nuevo.','Cuenta verificada. Cargando tu reino.'],
 'pt-BR':['ou','Continuar com Google','Continuar com Apple',
  'Seu progresso pertence à sua conta. Outro método de login pode criar uma conta separada.',
  'Este método ainda não está ativo. Entre com e-mail ou tente mais tarde.',
  'O link seguro de acesso é inválido ou expirou. Tente novamente.',
  'Não foi possível concluir o login social. Tente novamente.','Conta verificada. Carregando seu reino.'],
 'fr':['ou','Continuer avec Google','Continuer avec Apple',
  'Votre progression est liée à votre compte. Une autre méthode de connexion peut créer un compte distinct.',
  'Cette méthode n’est pas encore activée. Connectez-vous par e-mail ou réessayez plus tard.',
  'Le lien de connexion sécurisé est invalide ou expiré. Réessayez.',
  'La connexion a échoué. Veuillez réessayer.','Compte vérifié. Chargement de votre royaume.'],
 'de':['oder','Mit Google fortfahren','Mit Apple fortfahren',
  'Dein Fortschritt ist an dein Konto gebunden. Eine andere Anmeldung kann ein neues Konto erstellen.',
  'Diese Anmeldung ist noch nicht aktiviert. Melde dich per E-Mail an oder versuche es später.',
  'Der sichere Anmeldelink ist ungültig oder abgelaufen. Versuche es erneut.',
  'Die Anmeldung konnte nicht abgeschlossen werden. Versuche es erneut.','Konto bestätigt. Dein Königreich wird geladen.'],
 'it':['oppure','Continua con Google','Continua con Apple',
  'I progressi sono legati al tuo account. Un metodo diverso può creare un account separato.',
  'Questo metodo non è ancora attivo. Accedi tramite e-mail o riprova più tardi.',
  'Il link di accesso sicuro non è valido o è scaduto. Riprova.',
  'Accesso social non riuscito. Riprova.','Account verificato. Caricamento del regno.'],
 'ru':['или','Продолжить с Google','Продолжить с Apple',
  'Прогресс привязан к учётной записи. Другой способ входа может создать отдельную запись.',
  'Этот способ входа пока недоступен. Войдите по почте или повторите позже.',
  'Безопасная ссылка недействительна или устарела. Повторите попытку.',
  'Не удалось завершить вход. Попробуйте снова.','Учётная запись подтверждена. Загрузка королевства.'],
 'ar':['أو','المتابعة باستخدام Google','المتابعة باستخدام Apple',
  'يرتبط تقدمك بهوية حسابك. قد يؤدي استخدام طريقة دخول مختلفة إلى إنشاء حساب منفصل.',
  'طريقة الدخول هذه غير مفعّلة بعد. استخدم البريد الإلكتروني أو حاول لاحقًا.',
  'رابط الدخول الآمن غير صالح أو انتهت صلاحيته. حاول مجددًا.',
  'تعذر إكمال تسجيل الدخول. حاول مجددًا.','تم التحقق من الحساب. جارٍ تحميل مملكتك.'],
 'hi':['या','Google से जारी रखें','Apple से जारी रखें',
  'आपकी प्रगति आपके खाते से जुड़ी है। दूसरे साइन-इन तरीके से अलग खाता बन सकता है।',
  'यह साइन-इन तरीका अभी सक्रिय नहीं है। ईमेल से प्रवेश करें या बाद में प्रयास करें।',
  'सुरक्षित साइन-इन लिंक अमान्य है या समाप्त हो चुका है। फिर प्रयास करें।',
  'सामाजिक साइन-इन पूरा नहीं हुआ। फिर प्रयास करें।','खाता सत्यापित हुआ। आपका राज्य लोड हो रहा है।'],
 'id':['atau','Lanjutkan dengan Google','Lanjutkan dengan Apple',
  'Progres terikat pada identitas akun. Cara masuk lain dapat membuat akun terpisah.',
  'Metode masuk ini belum aktif. Gunakan email atau coba lagi nanti.',
  'Tautan masuk aman tidak valid atau kedaluwarsa. Coba lagi.',
  'Login sosial gagal diselesaikan. Coba lagi.','Akun terverifikasi. Memuat kerajaanmu.'],
 'ja':['または','Googleで続行','Appleで続行',
  '進行状況はアカウントに紐づきます。別のログイン方法では別のアカウントになる場合があります。',
  'このログイン方法はまだ有効ではありません。メールでログインするか、後ほどお試しください。',
  '安全なログインリンクが無効か期限切れです。もう一度お試しください。',
  'ソーシャルログインを完了できませんでした。再試行してください。','アカウントを確認しました。王国を読み込み中です。'],
 'ko':['또는','Google로 계속하기','Apple로 계속하기',
  '게임 진행은 계정에 연결됩니다. 다른 로그인 방법은 별도 계정을 만들 수 있습니다.',
  '이 로그인 방법은 아직 활성화되지 않았습니다. 이메일로 로그인하거나 나중에 다시 시도하세요.',
  '보안 로그인 링크가 유효하지 않거나 만료되었습니다. 다시 시도하세요.',
  '소셜 로그인을 완료하지 못했습니다. 다시 시도하세요.','계정이 확인되었습니다. 왕국을 불러오는 중입니다.'],
 'zh-CN':['或','使用 Google 继续','使用 Apple 继续',
  '游戏进度与账户身份绑定。使用其他登录方式可能会创建独立账户。',
  '此登录方式尚未启用。请使用邮箱登录或稍后重试。',
  '安全登录链接无效或已过期。请重试。',
  '无法完成社交登录。请重试。','账户已验证。正在加载你的王国。']
};
export const SOCIAL_TRANSLATIONS=Object.freeze(Object.fromEntries(
 Object.entries(translations).map(([language,values])=>[
  language,Object.freeze(Object.fromEntries(SOCIAL_KEYS.map((key,i)=>[key,values[i]])))
 ])
));
export function auditSocialTranslations(locales){
 return locales.flatMap(locale=>SOCIAL_KEYS.filter(key=>
  typeof SOCIAL_TRANSLATIONS[locale]?.[key]!=='string'||!SOCIAL_TRANSLATIONS[locale][key].trim()
 ).map(key=>locale+'.'+key));
}
