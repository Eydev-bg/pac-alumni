@component('mail::message')
# Reset Your Password

Hello {{ $userName }},

We received a request to reset the password for your account. Click the button below to choose a new password.

@component('mail::button', ['url' => $resetUrl])
Reset Password
@endcomponent

This link will expire in **1 hour**. If you did not request a password reset, no action is needed — your password will stay the same.

If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:

{{ $resetUrl }}

Thanks,<br>
{{ config('app.name') }}
@endcomponent