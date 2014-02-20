var isDirty = false;
var isLocating = false;
var coords = [];
var spinCtrlLeft;
var spinCtrlTop;
var spinCtrlWidth;
var spinCtrlHeight;

var NameGenerator = {
    seq  : 0,
    next : function() {
               ++ this.seq;
               if ( this.seq == 1 )
                  return 'btn';
               return 'btn' + this.seq;
           }
};

function enumAllEditObjects( callback )
{
    var divs = document.getElementsByTagName( 'DIV' );
    for ( var i = divs.length - 1; i >= 0; i-- ) {
        if ( typeof( divs[i].getSpec ) == 'function' ) {
            callback( divs[i] );
        }
    }
}

var EditObjectWrapper = {

    getSpec: function() {
        var spec = {};
        spec.className = this.innerText;
        spec.left = this.offsetLeft;
        spec.top = this.offsetTop;
        spec.width = this.offsetWidth;
        spec.height = this.offsetHeight;
        spec.isCur = this.className == 'obj_frame_cur';
        return spec;
    },

    populateSpec: function( spec ) {
        this.className = spec.isCur ? 'obj_frame_cur' : 'obj_frame';
        this.style.left = spec.left + 'px';
        this.style.top  = spec.top + 'px';
        this.style.width  = spec.width + 'px';
        this.style.height = spec.height + 'px';
        this.innerText = spec.className;
    },

    isNameEqualsTo: function( name ) {
        return this.innerText == name;
    },

    isNameBelongsTo: function( name ) {
        return this.innerText == name || ( this.innerText + ':hover' ) == name || this.innerText == ( name + ':hover' );
    },

    isCur: function() {
        return this.className == 'obj_frame_cur';
    },

    onDragMove: function() {
        $('inputClass').value = this.innerText;
        refreshPreview( this.getSpec() );
        isDirty = true;
    },

    onDragStart: function() {
        enumAllEditObjects( function( obj ) {
            obj.className = 'obj_frame';
        });
        this.className = 'obj_frame_cur';
        this.onDragMove();
    },

    wrapIt: function( obj ) {
        Object.extend( obj, {
                getSpec         : this.getSpec,
                populateSpec    : this.populateSpec,
                isNameEqualsTo  : this.isNameEqualsTo,
                isNameBelongsTo : this.isNameBelongsTo,
                isCur           : this.isCur,
                onDragMove      : this.onDragMove,
                onDragStart     : this.onDragStart
            }); 

        DragMove.makeDraggable( obj );
    }
};

function loadProject()
{
    if ( isDirty ) {
        if ( ! confirm( '�����޸ĵ�������δ���棬����ָ������Ŀ�ļ��������������ݶ�ʧ��\r\n�Ƿ�ȷ�ϼ���������Ŀ�ļ���' ) )
            return;
    }

    // �����ļ����򿪲���ȡ�ļ�����
    var file = $('fileProj').value;

    var fso = new ActiveXObject( 'Scripting.FileSystemObject' );
    if ( ! fso.FileExists( file ) ) {
        alert( 'ָ������Ŀ�ļ�������: ' + file );
        return;
    }

    var ext = fso.GetExtensionName( file ).toLowerCase();
    if ( ext != 'ibmprj' ) {
        alert( '��Ŀ�ļ�����չ�������� .ibmprj' );
        return;
    }

    var stream = '{}';
    try {
        var ts = fso.OpenTextFile( file, 1 );
        try {
            stream = ts.ReadAll();
        } catch(e) { }
        ts.Close();
    } catch(e) {
        alert( '�޷����ļ�: ' + file );
        return;
    }

    // �����ļ�����
    var dat = { image:'', specs:[] };
    try {
        //dat = JSON.parse( stream );
        dat = stream.evalJSON();
    } catch(e) {
        alert( '��Ŀ�ļ������޷���ȷ������' );
        return;
    }

    // ɾ�����еı༭����
    enumAllEditObjects( function( obj ) {
        obj.parentElement.removeChild( obj );
    });

    // ���ݽ����������������ָ��༭�ֳ�
    $('fileImage').value = dat.image;
    onChangeImage();

    NameGenerator.seq = 0;

    for ( var i=0; i < dat.specs.length; i++ ) {
        var spec = dat.specs[i];
        createEditObject( spec );
    }
    isDirty = false;
}

function saveProject()
{
    var file = $('fileProj').value;

    var fso = new ActiveXObject( 'Scripting.FileSystemObject' );
    if ( fso.FileExists( file ) ) {
        if ( ! confirm( 'ָ������Ŀ�ļ��Ѿ����ڡ�\r\n��ȷ���Ƿ񸲸ǣ�' ) )
            return;
    }

    // ���ݱ༭�ֳ�������Ŀ�ļ�����
    var specs = [];
    enumAllEditObjects( function( obj ) {
        specs.push( obj.getSpec() );
    });

    var stream = Object.toJSON({
                    image : $('fileImage').value,
                    specs : specs
                });

    // д��Ŀ�ļ�
    try {
        var ts = fso.CreateTextFile( file, true );
        try {
            ts.Write( stream );
        } catch(e) {
            alert( 'д�ļ�����: ' + file );
            ts.Close();
            return;
        }
        ts.Close();
    } catch(e) {
        alert( '�޷�д�ļ�: ' + file );
        return;
    }

    isDirty = false;

    // �ļ�����ɫ����
    function fadeToBlack( c ) {
        if ( c <= 128 ) {
            $('fileProj').style.color = '';
            return;
        }

        var hex = (c).toPaddedString( 2, 16 );
        $('fileProj').style.color = '#' + hex + '0000';
        setTimeout( function() { fadeToBlack( c - 3 ); }, 10 );
    }
    fadeToBlack( 255 );
}


function exportHtml()
{
    function negPixel( v ) {
        if ( v == 0 ) {
            return '0px';
        } else if ( v > 0 ) {
            return '-' + v + 'px';
        } else {
            return ( -1 * v ) + 'px';
        }
    }

    // �ӱ༭�ֳ��ռ�����
    var btns = { };
    enumAllEditObjects( function( obj ) {
        var className = obj.innerText;
        var baseName = className;
        var bIsHover = className.endsWith(':hover');
        if ( bIsHover ) {
            baseName = className.substr( 0, className.length - 6 );
        }

        var btn = btns[ baseName ];
        if ( ! btn ) {
            btn = { };
            btns[ baseName ] = btn;
        }

        if ( bIsHover ) {
            btn.hoverSpec = {left  : obj.offsetLeft,
                             top   : obj.offsetTop };
        } else {
            btn.baseSpec = { left  : obj.offsetLeft,
                             top   : obj.offsetTop,
                             width : obj.offsetWidth,
                             height: obj.offsetHeight };
        }
    });

    // ��ȡ��������������
    var names = [];
    for ( var className in btns ) {
        names.push( className );
    }
    names.sort();

    // �����������
    var seg1 = '';  // ���� class ͨ�õ� style ����
    var seg2 = '';  // ÿ�� class �Լ��� style ����
    var seg3 = '';  // ����չʾЧ���� HTML

    for ( var i=0; i < names.length; i++ ) {
        var className = names[ i ];
        var baseSpec  = btns[ className ].baseSpec;
        var hoverSpec = btns[ className ].hoverSpec;

        names[ i ] = '.' + names[i];

        if ( baseSpec ) {
            seg2 += '.' + className + '       { background-position:' + negPixel( baseSpec.left ) + ' ' + negPixel( baseSpec.top ) + '; width:' + baseSpec.width + 'px; height:' + baseSpec.height + 'px; }\r\n';
        }

        if ( hoverSpec ) {
            seg2 += '.' + className + ':hover { background-position:' + negPixel( hoverSpec.left ) + ' ' + negPixel( hoverSpec.top ) + '; }\r\n';
        }

        seg3 += '<p>' + className + ': <button class=\"' + className + '\"></button>\r\n'
    }

    seg1 = names.join( ',\r\n' ) + '\r\n    { background-image:url(' + $('fileImage').value.replace( /\\/g , '\\\\' ) + '); background-color:transparent; border:0px; cursor:pointer; }';

    var doc = window.open().document;
    doc.writeln( '<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">' );
    doc.writeln( '<html xmlns=\"http://www.w3.org/1999/xhtml\">' );
    doc.writeln( '<head>' );
    doc.writeln( '<meta http-equiv=\"content-type\" content=\"text/html; charset=GBK\" />' );
    doc.writeln( '<title>ͼƬ��ť������</title>' );
    doc.writeln( '<style type=\"text/css\">' );
    doc.writeln( '' );
    doc.writeln( seg1 );
    doc.writeln( '' );
    doc.writeln( seg2 );
    doc.writeln( '</style>' );
    doc.writeln( '</head>' );
    doc.writeln( '<body>' );
    doc.writeln( '' );
    doc.writeln( seg3 );
    doc.writeln( '</body>' );
    doc.writeln( '</html>' );
}

function createEditObject( spec )
{
    var obj = document.createElement( 'DIV' )
    $('btn_frames').appendChild( obj );

    EditObjectWrapper.wrapIt( obj );
    obj.populateSpec( spec );

    if ( obj.isCur() ) {
        obj.onDragStart();
    }
    return obj;
}

function isNameExists( className, bHoverAsSame )
{
    var bExists = false;
    if ( bHoverAsSame ) {
        enumAllEditObjects( function( obj ) {
            if ( obj.isNameBelongsTo( className ) )
                bExists = true;
        });
    } else {
        enumAllEditObjects( function( obj ) {
            if ( obj.isNameEqualsTo( className ) )
                bExists = true;
        });
    }
    return bExists;
}

function addBtn()
{
    // �ҵ�һ�����õ�������
    var btnClass = $('inputClass').value;
    var newName = '';
    if ( btnClass.length == 0 || btnClass.endsWith(':hover') ) {
        newName = NameGenerator.next();
    } else {
        newName = btnClass + ':hover';
    }

    while ( isNameExists( newName, false ) ) {
        newName = NameGenerator.next();
    }

    // �¶����λ������
    var newLeft   = spinCtrlLeft.getValue();
    var newTop    = spinCtrlTop.getValue();
    var newWidth  = spinCtrlWidth.getValue();
    var newHeight = spinCtrlHeight.getValue();

    if ( newName.endsWith( ':hover' ) ) {
        newLeft += newWidth;
    } else {
        //newLeft   = 0;
        //newTop    = 0;
        //newWidth  = 100;
        //newHeight = 30;
    }

    // ȡ��ԭ���ġ���ǰ������
    enumAllEditObjects( function( obj ) {
        obj.className = 'obj_frame';
    });

    // �����¶���
    createEditObject({
                className   : newName,
                left        : newLeft,
                top         : newTop,
                width       : newWidth,
                height      : newHeight,
                isCur       : true
             });
    isDirty = true;
}

function delBtn()
{
    // ɾ������ǰ������
    enumAllEditObjects( function( obj ) {
        if ( obj.isCur() ) {
            obj.parentElement.removeChild( obj );
            isDirty = true;
        }
    });

    $('inputClass').value = '';
    spinCtrlLeft.setValue( 0 );
    spinCtrlTop.setValue( 0 );
    spinCtrlWidth.setValue( 100 );
    spinCtrlHeight.setValue( 20 );
}

function showBtns( dis )
{
    setTimeout( function() {
                    enumAllEditObjects( function( obj ) {
                        obj.style.visibility = dis ? 'visible' : 'hidden';
                    });
                }, 0);
}

function onChangeClass()
{
    // ��Ҫȷ�����ڡ���ǰ������
    var oldName = '';
    enumAllEditObjects( function( obj ) {
        if ( obj.isCur() ) {
            var spec = obj.getSpec();
            oldName = spec.className;
        }
    });

    if ( oldName.blank() ) {
        $('inputClass').value = '';
        return;
    }

    // �������ֽ��кϷ��Լ��
    var newName = $('inputClass').value;
    newName = newName.strip();
    if ( newName.empty() ) {
        alert( 'class ���ֲ���Ϊ�ա�' );
        return;
    }

    if ( ! /^[\w:]+$/.test( newName ) ) {
        alert( 'class ֻ�ܰ�����Ч�ַ���' );
        return;
    }

    $('inputClass').value = newName;

    if ( newName == oldName ) {
        return;
    }

    if ( isNameExists( newName, false ) ) {
        alert( 'class �����Ѿ���ʹ��: ' + newName );
        return;
    }

    enumAllEditObjects( function( obj ) {
        if ( obj.isCur() ) {
            var spec = obj.getSpec();
            spec.className = newName;
            obj.populateSpec( spec );
            isDirty = true;
        }
    });
}

function onChangeImage()
{
    $('btn_image').src = $('fileImage').value;
    refreshPreview();
    isDirty = true;
}

function refreshPreview( spec )
{
    var preview = $('btn_preview');
    preview.style.backgroundImage = 'url(' + $('fileImage').value + ')';

    if ( spec ) {
        spinCtrlLeft.setValue( spec.left );
        spinCtrlTop.setValue( spec.top );
        spinCtrlWidth.setValue( spec.width );
        spinCtrlHeight.setValue( spec.height );

        preview.style.backgroundPositionX = -1 * spec.left;
        preview.style.backgroundPositionY = -1 * spec.top;
        preview.style.width = spec.width + 'px';
        preview.style.height = spec.height + 'px';
        preview.innerText = '';
    }
}

function zoomTo( n )
{
    var preview = $('btn_preview');
    preview.style.zoom = n;

    var zoomer = $('zoomer');
    zoomer.style.width = 'auto';
    if ( zoomer.offsetWidth < preview.offsetWidth )
        zoomer.style.width = preview.offsetWidth;
}

function toggleCoords()
{
    isLocating = ! isLocating;
    if ( isLocating ) {
        $('btn_frames').style.cursor = 'crosshair';
        coords = [];
        writeCoords();
    } else {
        $('btn_frames').style.cursor = 'default';
    }
}

function writeCoords( x, y )
{
    var str = '';
    for ( var i=0; i < coords.length; i++ ) {
        str += coords[i].x + ',';
        str += coords[i].y + ',';
    }

    if ( arguments.length >= 2 ) {
        str += '\r\n';
        str += '(' + x + ', ' + y + ')';
    }

    $('coords').innerText = str;
}

function recCoord()
{
    if ( ! isLocating ) return;
    coords.push( { x: window.event.offsetX, y: window.event.offsetY } );
    writeCoords();
}

function showCoord()
{
    if ( ! isLocating ) return;
    writeCoords( window.event.offsetX, window.event.offsetY );
}

function onPageLoad()
{
    isDirty = false;

    var path = document.location.href;
    if ( path.substr( 0, 8 ) == "file:///" ) {
        path = path.substr( 8 );
    }
    var pos = path.lastIndexOf( '/' );
    if ( pos > 0 ) {
        path = path.substr( 0, pos );
    }
    path = path.replace( /\//g , '\\' );
    $('fileImage').value = path + '\\buttons.gif';
    $('fileProj').value = path + '\\demo.ibmprj';
    $('inputClass').value = '';

    spinCtrlLeft = new SpinCtrl(0);
    spinCtrlLeft.bindInputField( $('inputLeft') );
    spinCtrlLeft.bindDecreaseBtn( $('decreaseLeft') );
    spinCtrlLeft.bindIncreaseBtn( $('increaseLeft') );
    spinCtrlLeft.setValueListener(
                    function( newVal ) {
                        enumAllEditObjects( function( obj ) {
                            if ( obj.isNameEqualsTo( $('inputClass').value ) ) {
                                var spec = obj.getSpec();
                                spec.left = newVal;
                                obj.populateSpec( spec );
                                if ( obj.isCur() ) {
                                    refreshPreview( spec );
                                }
                            }
                        });
                    });

    spinCtrlTop = new SpinCtrl(0);
    spinCtrlTop.bindInputField( $('inputTop') );
    spinCtrlTop.bindDecreaseBtn( $('decreaseTop') );
    spinCtrlTop.bindIncreaseBtn( $('increaseTop') );
    spinCtrlTop.setValueListener(
                    function( newVal ) {
                        enumAllEditObjects( function( obj ) {
                            if ( obj.isNameEqualsTo( $('inputClass').value ) ) {
                                var spec = obj.getSpec();
                                spec.top = newVal;
                                obj.populateSpec( spec );
                                if ( obj.isCur() ) {
                                    refreshPreview( spec );
                                }
                            }
                        });
                    });

    spinCtrlWidth = new SpinCtrl(100);
    spinCtrlWidth.bindInputField( $('inputWidth') );
    spinCtrlWidth.bindDecreaseBtn( $('decreaseWidth') );
    spinCtrlWidth.bindIncreaseBtn( $('increaseWidth') );
    spinCtrlWidth.setValueListener(
                    function( newVal ) {
                        enumAllEditObjects( function( obj ) {
                            if ( obj.isNameBelongsTo( $('inputClass').value ) ) {
                                var spec = obj.getSpec();
                                spec.width = newVal;
                                obj.populateSpec( spec );
                                if ( obj.isCur() ) {
                                    refreshPreview( spec );
                                }
                            }
                        });
                    });

    spinCtrlHeight = new SpinCtrl(20);
    spinCtrlHeight.bindInputField( $('inputHeight') );
    spinCtrlHeight.bindDecreaseBtn( $('decreaseHeight') );
    spinCtrlHeight.bindIncreaseBtn( $('increaseHeight') );
    spinCtrlHeight.setValueListener(
                    function( newVal ) {
                        enumAllEditObjects( function( obj ) {
                            if ( obj.isNameBelongsTo( $('inputClass').value ) ) {
                                var spec = obj.getSpec();
                                spec.height = newVal;
                                obj.populateSpec( spec );
                                if ( obj.isCur() ) {
                                    refreshPreview( spec );
                                }
                            }
                        });
                    });

    try {
        new ActiveXObject( 'Scripting.FileSystemObject' );
    } catch(e) {
        $('btnLoadProject').disabled = true;
        $('btnSaveProject').disabled = true;
        alert( '��ҳ���޷�ʹ�� ActiveX ���󣬽��޷����С�������Ŀ���͡�������Ŀ���Ĳ�����' );
    }
}
