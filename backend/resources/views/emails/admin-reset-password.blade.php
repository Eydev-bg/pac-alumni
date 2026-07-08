@component('mail::message')
# Password Reset Requested

Hello {{ $userName }},

An administrator has initiated a password reset for your account. Click the button below to choose a new password.

@component('mail::button', ['url' => $resetUrl])
Reset Password
@endcomponent

This link will expire in **1 hour**. If you believe this was a mistake, please contact your administrator — your password will stay the same until you set a new one.

Thanks,<br>
{{ config('app.name') }}

@slot('subcopy')
If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:

[{{ $resetUrl }}]({{ $resetUrl }})
@endslot
@endcomponent
