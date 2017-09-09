/**
 * Emoojis
 * https://github.com/AlexxTrs/Emoojis
 *
 * Copyright (c) 2017 by AlexxTrs
 *
 * Licensed under the Apache license v2.0
 */

(function ($) {
    'use strict';
    
    $.fn.emoojis = function (options) {
        var defaults = {
            text: undefined,
            hide: null,
            active: undefined,
            names: {
                smiles: 'smiles and people',
                nature: 'animals and nature',
                food: 'food and drink',
                activities: 'activities',
                places: 'travel and places',
                objects: 'objects',
                symbols: 'symbols',
                flags: 'flags'
            }
        },
            $this = $(this), $src;
        
        $.extend(defaults, options);
        
        $src = "public/emojis_frame.html?";
        
        if(defaults.text != undefined)
            $src += "&text=" + defaults.text;
        
        $src += "&smiles=" + defaults.names.smiles +
            "&nature=" + defaults.names.nature +
            "&food=" + defaults.names.food +
            "&activities=" + defaults.names.activities +
            "&places=" + defaults.names.places +
            "&objects=" + defaults.names.objects +
            "&symbols=" + defaults.names.symbols +
            "&flags=" + defaults.names.flags;
        
        if(defaults.hide != null)
            if(defaults.active !== undefined) {
                for(var i = 0; i < defaults.hide.length; i++) {
                    if(defaults.active !== defaults.hide[i]) {
                        if(i === 0)
                            $src += "&hide=" + defaults.hide[i] + "-";
                        else if(i === defaults.hide.length - 1)
                            $src += defaults.hide[i];
                        else
                            $src += defaults.hide[i] + "-";
                    } else
                        console.warn("Do not use a value for active that exists in hide");
                }
            } else
                console.warn("For use the option hide, you have that declarate the attribute active");
        
        $src += "&active=" + (defaults.active || "smiles");
        
        $("<iframe></iframe>", {
            id: 'emoojis',
            src: $src,
            overflow: 'hidden',
            scrolling: 'no'
        }).css({
            width: '100%',
            border: 'none'
        }).appendTo($this);
        
        $('body').append('<script type="text/javascript">iFrameResize({log: false}, "#emoojis");</script>');
    };    
}(jQuery));
