// ---- Define your dialogs  and panels here ----
    $('#filestructure').append('<p class="title-text">See files and edit permissions here:</p>')

    // (Sandhya) Added ability to choose file in addition to user when checking permissions
    var file_selector = '<br><p> Select a file:</p>'
    file_selector += '<input type="radio" name="file" value="presentation_documents/important_file.txt">important_file.txt<br>'
    file_selector += '<input type="radio" name="file" value="presentation_documents/presentation.ppt">presentation.ppt<br>'
    file_selector += '<input type="radio" name="file" value="important_project/project_file_1.txt">project_file_1.txt<br>'
    file_selector += '<input type="radio" name="file" value="important_project/project_file_2.txt">project_file_2.txt<br>'
    file_selector += '<input type="radio" name="file" value="intern_subproject/internship_file_1.tx">internship_file_1.txt<br>'
    file_selector += '<input type="radio" name="file" value="intern_subproject/internship_file_2.txt">internship_file_2.txt<br>'
    file_selector += '<input type="radio" name="file" value="Lecture_Notes/Lecture1.txt">Lecture1.txt<br>'
    file_selector += '<input type="radio" name="file" value="Lecture_Notes/Lecture2.txt">Lecture2.txt<br>'
    file_selector += '<input type="radio" name="file" value="Lecture_Notes/Lecture3.txt">Lecture3.txt<br>'
    file_selector += '<input type="radio" name="file" value="Lecture_Notes/Lecture4.txt">Lecture4.txt<br>'
    file_selector += '<br><button type="button" id="submitbutton" onclick="getResult()">Submit</button>'

    function getResult() {
        var options = document.getElementsByName('file');
        
        for (i=0; i<options.length; i++){
            if (options[i].checked){
                filepath = '/C/' + options[i].value;
                
            }
        }
        console.log(filepath)
    }

    // Description for effective permissions panel
    var panel_description = '<p class="title-text">Select a file and user here to see their current permissions:</p>'
    $('#sidepanel').append(panel_description)

    $('#sidepanel').append(file_selector)

    // show user selector/append to side panel element
    var user_selector = define_new_user_select_field("user", "Select user", on_user_change = function(selected_user){
        $('#permission').attr('username', selected_user)
        $('#permission').attr('filepath', filepath)
        // !! need to make above line more general 
        // $('#permission').attr('filepath', $(this).attr('username'))
    })
    $('#sidepanel').append(user_selector)

    var effective_permissions = define_new_effective_permissions("permission", add_icon_col = true, which_permissions = null)
    // show side panel
    // $('#sidepanel').append(effective_permissions)
        
    // 1. Define the dialog
    //Changed text to user permissions
    var new_dialog = define_new_dialog('new', 'User Permissions')

    // 2. Open the dialog on click
    $('.perm_info').click(function(){
        // stuff that should happen on click goes here
        console.log('clicked!')
        new_dialog.dialog('open')
        console.log($('#permission').attr('filepath'))
        console.log($('#permission').attr('username'))
        console.log($(this).attr('permission_name'))
        
        var filepath = $('#permission').attr('filepath')
        var username = $('#permission').attr('username')
        var permissionType = $(this).attr('permission_name')

        var fileObject = path_to_file[filepath]
        var userObject = all_users[username]
    
        var explanation = allow_user_action(fileObject, userObject, permissionType, explain_why = true)
        var explanationText = get_explanation_text(explanation)
        
        new_dialog.empty().append(explanationText).dialog('open')
    })

    // (Christine) Define confirmation dialog
    var confirmation_dialog = define_new_dialog('new', 'Confirmation of Change')
    // (Christine) Open confirmation dialog when an edit to permissions is made
    $('.groupcheckbox').click(function(){
        console.log('checkbox button clicked!')
        confirmation_dialog.empty().append('Your change has been made.').dialog('open')
    })

//(Brian) this is the actual function that toggles the permissions. It should be connected to the backend. LMK if it needs to be modified.
$(document).ready(function() {
    $('body').on('change', '.groupcheckbox', function() {
        let checked = $(this).is(':checked');
        let currentGroup = $(this).attr('group');
        let currentType = $(this).attr('ptype'); 
        let username = $(this).closest('table').attr('username');
        let filepath = $(this).closest('table').attr('filepath');
        let oppositeType = currentType === 'allow' ? 'deny' : 'allow';
        let oppositeCheckbox = $(`input[group="${currentGroup}"][ptype="${oppositeType}"]`);
        if(oppositeCheckbox.is(':checked')) {
            oppositeCheckbox.prop('checked', false);
            toggle_permission_group(filepath, username, currentGroup, oppositeType, false);
        }
        toggle_permission_group(filepath, username, currentGroup, currentType, checked);
        // update_group_checkboxes(); // Uncomment if there's a need to refresh the UI immediately
    }); 
});



// ---- Display file structure ----

// (recursively) makes and returns an html element (wrapped in a jquery object) for a given file object
function make_file_element(file_obj) {
    let file_hash = get_full_path(file_obj)

    if(file_obj.is_folder) {
        let folder_elem = $(`<div class='folder' id="${file_hash}_div">
            <h3 id="${file_hash}_header">
                <span class="oi oi-folder" id="${file_hash}_icon"/> ${file_obj.filename} 
                <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton"> 
                    <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> 
                </button>
            </h3>
        </div>`)

        // append children, if any:
        if( file_hash in parent_to_children) {
            let container_elem = $("<div class='folder_contents'></div>")
            folder_elem.append(container_elem)
            for(child_file of parent_to_children[file_hash]) {
                let child_elem = make_file_element(child_file)
                container_elem.append(child_elem)
            }
        }
        return folder_elem
    }
    else {
        return $(`<div class='file'  id="${file_hash}_div">
            <span class="oi oi-file" id="${file_hash}_icon"/> ${file_obj.filename}
            <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton"> 
                <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> 
            </button>
        </div>`)
    }
}

for(let root_file of root_files) {
    let file_elem = make_file_element(root_file)
    $( "#filestructure" ).append( file_elem);    
}



// make folder hierarchy into an accordion structure
$('.folder').accordion({
    collapsible: true,
    heightStyle: 'content'
}) // TODO: start collapsed and check whether read permission exists before expanding?


// -- Connect File Structure lock buttons to the permission dialog --
$('.permbutton').append('Edit permissions')

// open permissions dialog when a permission button is clicked
$('.permbutton').click( function( e ) {
    // Set the path and open dialog:
    let path = e.currentTarget.getAttribute('path');
    perm_dialog.attr('filepath', path)
    perm_dialog.dialog('open')
    //open_permissions_dialog(path)

    // Deal with the fact that folders try to collapse/expand when you click on their permissions button:
    e.stopPropagation() // don't propagate button click to element underneath it (e.g. folder accordion)
    // Emit a click for logging purposes:
    emitter.dispatchEvent(new CustomEvent('userEvent', { detail: new ClickEntry(ActionEnum.CLICK, (e.clientX + window.pageXOffset), (e.clientY + window.pageYOffset), e.target.id,new Date().getTime()) }))
});


// ---- Assign unique ids to everything that doesn't have an ID ----
$('#html-loc').find('*').uniqueId() 