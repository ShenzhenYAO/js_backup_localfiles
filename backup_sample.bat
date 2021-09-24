echo on
echo "it is running..."
echo off
Rem "need to open cmd and run as administrator"

xcopy "c:/Users/Z70/Desktop/src1" "c:/Users/Z70/Desktop/Backup_test1/src1" /c /d /e /h /i /k /q /r /s /x /y
xcopy "F:\Personal\Virtual_Server\PHPWeb\riddles_python" "c:/Users/Z70/Desktop/Backup_test1/riddles_python" /c /d /e /h /i /k /q /r /s /x /y



Rem some one suggest to use robocopy. However it requires administratior right as well!
Rem robocopy "C:/Users/Z70/Desktop/src1" "c:/Users/Z70/Desktop/Backup_test1/src1" /s /z /b /bz /j /e /xo
